from geopy.distance import geodesic
from sqlalchemy.orm import Session
from app.models import District
import json


def find_closest_district(lat: float, lon: float, db: Session):
    """
    Finds the closest district to the given latitude and longitude.

    Args:
        lat (float): Latitude of the point.
        lon (float): Longitude of the point.
        db (Session): Database session.

    Returns:
        District: The closest district object.
    """
    districts = db.query(District).all()
    closest_district = None
    min_distance = float("inf")

    for district in districts:
        distance = geodesic(
            (lat, lon), (district.latitude, district.longitude)
        ).kilometers
        if distance < min_distance:
            min_distance = distance
            closest_district = district

    return closest_district


def load_districts_from_json(db, file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        districts = json.load(file)
        for district in districts:
            # Check if the district already exists
            existing_district = (
                db.query(District).filter_by(name=district["name"]).first()
            )
            if not existing_district:
                new_district = District(
                    name=district["name"],
                    latitude=district["latitude"],
                    longitude=district["longitude"],
                    inventory={},  # Initialize with an empty inventory
                )
                db.add(new_district)
        db.commit()
