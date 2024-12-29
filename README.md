# Disaster Inventory Management System

This application is designed to manage district inventories, requests, and facilitate resource transfer during disasters. It supports user registration, inventory updates, request resolution, and inter-district inventory transfers.

## Getting Started

### Prerequisites
- Ensure you have **Docker** and **Docker Compose** installed on your system.

### Installation and Setup
1. Clone the repository to your local machine or server:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Ensure you are in the root directory where the `docker-compose.yml` file is located.

3. Build and start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```
   This will start the backend, frontend, database, Redis, and Celery services.

### Application Services
- **Frontend**: Accessible on port `3000`. Navigate to `http://<server-ip>:3000`.
- **Backend**: Accessible on port `8000`. Swagger documentation available at `http://<server-ip>:8000/docs`.
- **Database**: Postgres database exposed on port `5432`.
- **Redis**: Used for background tasks, exposed on port `6379`.

## Features

### User Registration
For demo purposes, the following hardcoded keys can be used during registration:
- **Admin Key**: `ADMIN12345`
- **Field Volunteer Key**: `FIELDVOLUNTEER67890`

### Inventory Management
- Add items to a district’s inventory.
- Remove items by specifying negative quantities.
- View the current inventory of any district.

### Request Management
- Create requests for resources by specifying type, subtype, and quantity.
- Resolve requests if the district has sufficient inventory.
- Change request status to `resolved` upon successful resolution.

### Inventory Transfer
- Transfer inventory items between districts.
- Validate sufficient inventory in the source district before transfer.

### Map Integration
- View district locations and details on an interactive map.

## API Endpoints

### Swagger Documentation
The API documentation is available at:
```
http://<server-ip>:8000/docs
```

### Key Endpoints
- `POST /register`: User registration.
- `POST /login`: User login.
- `POST /districts/{district_id}/inventory`: Update district inventory.
- `POST /districts/{source_district_id}/transfer/{target_district_id}`: Transfer inventory between districts.
- `POST /requests/{request_id}/resolve`: Resolve a specific request.

## Environment Variables
Ensure the following environment variable is set:  
(Rest are either hard-coded or within docker compose file)

### Frontend (`/frontend/.nginx.conf`):
```
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html; # Redirect all routes to index.html
    }

    # Serve static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf|ttc|map|json)$ {
        expires 6M;
        add_header Cache-Control "public";
    }

    error_page 404 /index.html; # Serve index.html for 404 errors
}

```

## Notes
- Make sure to configure Nginx or use environment variables to correctly route frontend requests to the backend when deployed to a server.

## Troubleshooting
- **Database connection issues**: Verify the Postgres container is running and accessible at `db:5432`.
- **Redis not working**: Ensure the Redis container is running and reachable on `6379`.
