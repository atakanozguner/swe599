from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, crud, database
from app.database import init_db, get_db
from datetime import datetime, timedelta
from app.tasks import celery_app
from jose import jwt, JWTError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from typing import List

app = FastAPI()

@app.on_event("startup")
def start_celery():
    celery_app.conf.update(task_serializer="json", accept_content=["json"], result_serializer="json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with frontend domain if you want stricter rules
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.on_event("startup")
def startup():
    init_db()

# Serve static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

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
        return {"message": "Registration successful", "username": created_user.username, "role": created_user.role}
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
            {"sub": db_user.username, "role": db_user.role, "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)},
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        return {"token": access_token, "role": db_user.role, "username": db_user.username}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error generating token")

@app.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    if token in token_blacklist:
        raise HTTPException(status_code=400, detail="Token already invalidated")
    token_blacklist.add(token)
    return {"message": "Logged out successfully"}

@app.get("/user-info")
def get_user_info(token: str = Depends(oauth2_scheme)):
    if token in token_blacklist:
        raise HTTPException(status_code=401, detail="Token invalidated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        return {"username": username, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


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
def submit_request(request: schemas.RequestCreate, db: Session = Depends(database.get_db)):
    """
    Endpoint to submit a new request with default priority based on type.
    """
    # Default priorities based on type
    default_priorities = {
        "water": 3,
        "shelter": 2,
        "food": 1,
        "medical": 2
    }

    try:
        # Assign default priority based on type
        priority = default_priorities.get(request.type, 1)  # Default to 1 if type is unknown

        # Create a new request object
        new_request = models.Request(
            type=request.type,
            subtype=request.subtype,
            priority=priority,
            latitude=request.latitude,
            longitude=request.longitude,
            notes=request.notes,
            timestamp=datetime.now(),
            status="pending"  # Default status
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        return new_request
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating request: {str(e)}")