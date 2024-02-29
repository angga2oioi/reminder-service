# Scheduled Message App

## Overview
This is a simple app designed to create and manage scheduled messages. with an added feature of automatically sending birthday message for every user on their birthday at 9 AM their local time

## Installation
- Ensure that you have Docker installed on your system.
- Run `docker-compose up -d`.
- The server will be accessible at `localhost:5000`.
## Testing
When the server is running on localhost:5000,
- Navigate to the `/test` directory in your project.
- run `npm install`
- run `npm test` 
## Usage
### Endpoints
- `POST /users`
    - Sample Body:
        ```json
        {
            "firstName": "first",
            "lastName": "last",
            "email": "asdf@mailer.com",
            "dob": "1920-02-22",
            "location": {
                "country": "Indonesia",
                "city": "Jakarta",
                "timezone": "Asia/Jakarta"
            }
        }
        ```
- `PUT /users/:id`
    - Sample Body:
        ```json
        {
            "firstName": "first",
            "lastName": "last",
            "email": "asdf@mailer.com",
            "dob": "1920-03-22",
            "location": {
                "country": "Indonesia",
                "city": "Jakarta",
                "timezone": "Asia/Jakarta"
            }
        }
        ```
- `DELETE /users/:id`
- `GET /users/:id/reminders`
- `POST /users/:id/reminders`
    - Sample Body:
        ```json
        {
            "schedule": "2024-03-01T13:00:00",
            "title": "Deadline",
            "message": "Deadline is passed",
            "repeat": "NONE" // other options are ANNUAL, QUARTERLY, MONTHLY, WEEKLY, DAILY
        }
        ```
- `DELETE /reminders/:id`
