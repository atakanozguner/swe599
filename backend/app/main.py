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
from typing import List

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
