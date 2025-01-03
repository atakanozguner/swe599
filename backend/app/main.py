from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, crud, database
from app.database import init_db, get_db
from datetime import datetime, timedelta
from app.tasks import celery_app
from app.utils import find_closest_district, load_districts_from_json
from jose import jwt, JWTError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from typing import List, Dict, Optional, Any

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.on_event("startup")
def start_celery():
    celery_app.conf.update(
        task_serializer="json", accept_content=["json"], result_serializer="json"
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with frontend domain if you want stricter rules
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.on_event("startup")
def startup():
    init_db()  # Ensure the database is initialized
    db = next(get_db())  # Get a database session
    try:
        # Call the function to load districts from the JSON file
        load_districts_from_json(
            db, "app/static/districts.json"
        )  # Update with the correct path
        print("Districts successfully initialized!")
    except Exception as e:
        print(f"Error initializing districts: {e}")
    finally:
        db.close()  # Close the database session to avoid leaks


# Serve static files

SECRET_KEY = "SECRETKEY123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Hardcoded keys for registration
ADMIN_KEY = "ADMIN12345"
FIELD_VOLUNTEER_KEY = "FIELDVOLUNTEER67890"

# Token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Token blacklist for logout functionality
token_blacklist = set()


@app.post("/register")
def register_user(user: schemas.UserCreate, key: str, db: Session = Depends(get_db)):
    # Determine the role based on the key
    if key == ADMIN_KEY:
        role = "administrator"
    elif key == FIELD_VOLUNTEER_KEY:
        role = "field_volunteer"
    else:
        raise HTTPException(status_code=400, detail="Invalid registration key")

    # Add the role to the user before creating
    user_data = user.dict()
    user_data["role"] = role

    try:
        created_user = crud.create_user(db, user_data)
        return {
            "message": "Registration successful",
            "username": created_user.username,
            "role": created_user.role,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error creating user")


@app.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.authenticate_user(db, user)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create a token
    try:
        access_token = jwt.encode(
            {
                "sub": db_user.username,
                "role": db_user.role,
                "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        return {
            "token": access_token,
            "role": db_user.role,
            "username": db_user.username,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error generating token")


@app.post("/logout")
def logout_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub", "unknown")
        if token not in token_blacklist:
            token_blacklist.add(token)
        return {"message": f"User {username} logged out successfully"}
    except (jwt.ExpiredSignatureError, jwt.JWTError):
        # Handle invalid or expired token gracefully
        return {"message": "Token invalid or expired. Logout successful."}
    except Exception as e:
        return {"message": f"Unexpected error: {str(e)}. Logout successful."}


# @app.get("/user-info")
# def get_user_info(token: str = Depends(oauth2_scheme)):
#     if token in token_blacklist:
#         raise HTTPException(status_code=401, detail="Token invalidated")
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username = payload.get("sub")
#         role = payload.get("role")
#         return {"username": username, "role": role}
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.JWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/requests", response_model=List[schemas.RequestResponse])
def get_all_requests(db: Session = Depends(database.get_db)):
    """
    Fetch all requests from the database.
    """
    try:
        requests = db.query(models.Request).all()
        return requests
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching requests")


@app.post("/submit-request", response_model=schemas.RequestResponse)
def submit_request(
    request: schemas.RequestCreate, db: Session = Depends(database.get_db)
):
    """
    Endpoint to submit a new request with default priority based on type.
    """
    # Default priorities based on type
    default_priorities = {"water": 3, "shelter": 2, "food": 1, "medical": 2}

    try:
        # Assign default priority based on type
        priority = default_priorities.get(
            request.type, 1
        )  # Default to 1 if type is unknown

        closest_district = find_closest_district(
            request.latitude, request.longitude, db
        )

        # Create a new request object
        new_request = models.Request(
            type=request.type,
            subtype=request.subtype,
            priority=priority,
            latitude=request.latitude,
            longitude=request.longitude,
            quantity=request.quantity if request.quantity is not None else 1,
            tckn=request.tckn,
            notes=request.notes,
            timestamp=datetime.now(),
            status="pending",  # Default status
            relatedDistrict=closest_district.id if closest_district else None,
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        return new_request
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating request: {str(e)}")


@app.get("/districts", response_model=List[schemas.DistrictResponse])
def get_districts(db: Session = Depends(get_db)):
    """
    Fetch all districts and include the number of requests for each.
    """
    districts = db.query(models.District).all()
    result = []
    for district in districts:
        request_count = (
            db.query(models.Request).filter_by(relatedDistrict=district.id).count()
        )
        result.append(
            {
                "id": district.id,
                "name": district.name,
                "latitude": district.latitude,
                "longitude": district.longitude,
                "inventory": district.inventory,
                "request_count": request_count,  # Include request count
            }
        )
    return result


@app.get(
    "/districts/{district_id}/requests", response_model=List[schemas.RequestResponse]
)
def get_requests_by_district(district_id: int, db: Session = Depends(get_db)):
    """
    Fetch all requests for a specific district.
    """
    return (
        db.query(models.Request)
        .filter(models.Request.relatedDistrict == district_id)
        .all()
    )


@app.get("/districts/{district_id}", response_model=schemas.DistrictResponse)
def get_district_by_id(district_id: int, db: Session = Depends(get_db)):
    """
    Fetch details of a specific district by ID.
    """
    # Fetch the district by ID
    district = (
        db.query(models.District).filter(models.District.id == district_id).first()
    )
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    # Count the number of requests related to this district
    request_count = (
        db.query(models.Request)
        .filter(models.Request.relatedDistrict == district.id)
        .count()
    )

    # Return the district details along with the request count
    return {
        "id": district.id,
        "name": district.name,
        "latitude": district.latitude,
        "longitude": district.longitude,
        "inventory": district.inventory,
        "request_count": request_count,
    }


@app.post("/districts/{district_id}/inventory")
def update_district_inventory(
    district_id: int,
    inventory_update: Dict[str, int],
    db: Session = Depends(get_db),
):
    """
    Update the inventory of a specific district.
    Allows adding and removing inventory items incrementally.
    """
    district = db.query(models.District).filter_by(id=district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    # Ensure current inventory is fetched from the database every time
    db.refresh(district)  # Ensure the district data is up-to-date
    current_inventory: Dict[str, int] = district.inventory or {}

    if not isinstance(current_inventory, dict):
        current_inventory = {}

    normalized_inventory_update = {
        item: quantity for item, quantity in inventory_update.items()
    }
    normalized_current_inventory = {
        item: quantity for item, quantity in current_inventory.items()
    }

    # Update inventory incrementally
    for item, quantity in normalized_inventory_update.items():
        current_quantity = normalized_current_inventory.get(item, 0)
        updated_quantity = current_quantity + quantity
        if updated_quantity < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce {item} below 0. Current: {current_quantity}, Attempted: {quantity}",
            )
        normalized_current_inventory[item] = updated_quantity

    # Remove items with zero quantity
    normalized_current_inventory = {
        item: qty for item, qty in normalized_current_inventory.items() if qty > 0
    }

    # Assign updated inventory back to the district
    district.inventory = normalized_current_inventory
    db.commit()
    db.refresh(district)

    return {
        "message": "Inventory updated successfully",
        "inventory": normalized_current_inventory,
    }


@app.post("/requests/{request_id}/resolve")
def resolve_request(request_id: int, db: Session = Depends(get_db)):
    request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status == "resolved":
        raise HTTPException(status_code=400, detail="Request is already resolved")

    # Fetch the district inventory
    district = (
        db.query(models.District)
        .filter(models.District.id == request.relatedDistrict)
        .first()
    )
    if not district:
        raise HTTPException(status_code=404, detail="Related district not found")

    inventory = district.inventory or {}

    # Construct the inventory key
    inventory_key = f"{request.type} - {request.subtype}"

    # Check if inventory is sufficient
    if inventory.get(inventory_key, 0) < request.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient inventory for {inventory_key}. Needed: {request.quantity}, Available: {inventory.get(inventory_key, 0)}",
        )

    # Deduct items from inventory
    inventory[inventory_key] -= request.quantity
    district.inventory = {
        k: v for k, v in inventory.items() if v > 0
    }  # Remove items with zero quantity

    # Mark request as resolved
    request.status = "resolved"

    db.commit()
    db.refresh(district)
    db.refresh(request)

    return {"message": "Request resolved successfully", "inventory": district.inventory}


@app.post("/districts/{source_district_id}/transfer/{target_district_id}")
def transfer_inventory(
    source_district_id: int,
    target_district_id: int,
    transfer_data: Dict[str, int],  # Key: item, Value: quantity
    db: Session = Depends(get_db),
):
    """
    Transfer inventory items from one district to another.
    """
    # Fetch source district
    source_district = (
        db.query(models.District)
        .filter(models.District.id == source_district_id)
        .first()
    )
    if not source_district:
        raise HTTPException(status_code=404, detail="Source district not found")

    # Fetch target district
    target_district = (
        db.query(models.District)
        .filter(models.District.id == target_district_id)
        .first()
    )
    if not target_district:
        raise HTTPException(status_code=404, detail="Target district not found")

    # Ensure both inventories are valid dictionaries
    source_inventory = source_district.inventory or {}
    target_inventory = target_district.inventory or {}

    if not isinstance(source_inventory, dict):
        source_inventory = {}
    if not isinstance(target_inventory, dict):
        target_inventory = {}

    # Normalize keys and validate the source inventory
    for item, quantity in transfer_data.items():
        if source_inventory.get(item, 0) < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory in source district for {item}. Needed: {quantity}, Available: {source_inventory.get(item, 0)}",
            )

    # Deduct from source inventory
    for item, quantity in transfer_data.items():
        source_inventory[item] -= quantity
        if source_inventory[item] <= 0:
            del source_inventory[item]  # Remove item if quantity is zero or less

    # Add to target inventory
    for item, quantity in transfer_data.items():
        target_inventory[item] = target_inventory.get(item, 0) + quantity

    # Update the database
    try:
        source_district.inventory = source_inventory
        target_district.inventory = target_inventory
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Refresh instances to get updated inventories
    db.refresh(source_district)
    db.refresh(target_district)

    return {
        "message": "Transfer successful",
        "source_inventory": source_district.inventory,
        "target_inventory": target_district.inventory,
    }
