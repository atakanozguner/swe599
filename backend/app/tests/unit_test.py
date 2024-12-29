from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, text
from sqlalchemy.orm import sessionmaker
import pytest
import app.models as models
import app.schemas as schemas
from app.main import app, submit_request
from datetime import datetime
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

client = TestClient(app)


# Define the 'users' table
def define_users_table(metadata):
    return Table(
        "users",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("username", String),
        Column("email", String),
    )


# Fixture for the database engine
@pytest.fixture(scope="module")
def db_engine():
    engine = create_engine("sqlite:///:memory:")
    metadata = MetaData()

    # Define the 'users' table
    define_users_table(metadata)

    metadata.create_all(engine)
    return engine


# Fixture for the database session
@pytest.fixture(scope="module")
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()


# Test to check if the 'users' table exists
def test_users_table_exists(db_session):
    result = db_session.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
    )
    assert result.fetchone() is not None


# Test to insert and query a user
def test_insert_and_query_user(db_session):
    users_table = define_users_table(MetaData())
    db_session.execute(users_table.insert().values(username="testuser"))
    db_session.commit()

    result = db_session.execute(text("SELECT * FROM users WHERE username='testuser'"))
    user = result.fetchone()
    assert user is not None
    assert user[1] == "testuser"


# @pytest.fixture
# def mock_db_session(mocker):
#     # Mock the database session
#     mock_db = MagicMock()

#     # Mock the database add, commit, and refresh methods
#     mock_db.add = MagicMock()
#     mock_db.commit = MagicMock()
#     mock_db.refresh = MagicMock()

#     # Mock the database dependency
#     mocker.patch("main.database.get_db", return_value=mock_db)
#     return mock_db


# def test_submit_request(mocker, mock_db_session):
#     # Mock the find_closest_district function
#     mocker.patch("main.find_closest_district", return_value=MagicMock(id=1))

#     # Create a sample request payload
#     request_payload = {
#         "type": "water",
#         "subtype": "bottled",
#         "latitude": 40.7128,
#         "longitude": -74.0060,
#         "quantity": 10,
#         "tckn": "12345678901",
#         "notes": "Urgent",
#     }

#     # Mock the Request model
#     mock_request = models.Request(
#         id=1,
#         type=request_payload["type"],
#         subtype=request_payload["subtype"],
#         priority=3,
#         latitude=request_payload["latitude"],
#         longitude=request_payload["longitude"],
#         quantity=request_payload["quantity"],
#         tckn=request_payload["tckn"],
#         notes=request_payload["notes"],
#         timestamp=datetime.now(),
#         status="pending",
#         relatedDistrict=1,
#     )

#     mock_db_session.refresh.return_value = mock_request

#     # Mock the add and commit methods to do nothing
#     mock_db_session.add.return_value = None
#     mock_db_session.commit.return_value = None

#     # Send the request to the endpoint
#     response = client.post("/submit-request", json=request_payload)

#     # Log the response for debugging
#     print(response.json())

#     # Assert the response
#     assert response.status_code == 200
#     response_data = response.json()
#     assert response_data["type"] == request_payload["type"]
#     assert response_data["subtype"] == request_payload["subtype"]
#     assert response_data["priority"] == 3
#     assert response_data["latitude"] == request_payload["latitude"]
#     assert response_data["longitude"] == request_payload["longitude"]
#     assert response_data["quantity"] == request_payload["quantity"]
#     assert response_data["tckn"] == request_payload["tckn"]
#     assert response_data["notes"] == request_payload["notes"]
#     assert response_data["status"] == "pending"
#     assert response_data["relatedDistrict"] == 1
