from celery import Celery
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models import Request

celery_app = Celery("tasks", broker="redis://redis:6379/0")

# Explicitly include tasks to ensure they're registered
celery_app.conf.update(
    include=["app.tasks"]  # Replace "app.tasks" with the actual module path if needed
)

# Priority adjustment constants
PRIORITY_INCREASE = {
    "water": lambda hours: 2**hours,  # Exponential
    "food": lambda hours: 1.5 * hours,  # Slower exponential
    "shelter": lambda hours: 1 * hours,  # Linear
    "clothes": lambda hours: 0.5 * hours,  # Slower linear
    "hygiene": lambda hours: 0.5 * hours,  # Slower linear
}

# Celery beat schedule for periodic task execution
celery_app.conf.beat_schedule = {
    "adjust-priorities-every-30-seconds": {
        "task": "app.tasks.adjust_priorities",  # Ensure the task path matches
        "schedule": 120.0,  # Run every 30 seconds
    }
}


@celery_app.task
def adjust_priorities():
    """Adjust the priority of pending requests based on time passed."""
    db: Session = SessionLocal()
    try:
        # Fetch all pending requests
        requests = db.query(Request).filter(Request.status == "pending").all()

        for request in requests:
            time_passed = (
                datetime.utcnow() - request.timestamp
            ).total_seconds() // 3600  # Time in hours
            if request.type in PRIORITY_INCREASE:
                increase = PRIORITY_INCREASE[request.type](time_passed)
                request.priority += int(increase)
                db.add(request)

        db.commit()
    except Exception as e:
        print("Error adjusting priorities:", e)
    finally:
        db.close()
