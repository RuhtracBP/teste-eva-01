# Activity Scheduler

A simple activity scheduler that uses BullMQ for job processing and Joi for input validation.

## Prerequisites

- Docker
- Docker Compose

## Running with Docker

1. Build and start the application:
```bash
docker-compose up --build
```

This will start:
- The web application on port 3000
- The worker process
- Redis server on port 6379

To stop the application:
```bash
docker-compose down
```

3. Open your browser and visit: http://localhost:3000

## Running Tests

```bash
npm test
```

## API Endpoints

- POST `/api/activities/schedule` - Schedule new activities
- GET `/api/activities/jobs/:userName` - Get all jobs for a specific user

## Frontend

The frontend provides a simple interface to:
- Schedule new activities
- View scheduled jobs for a user
