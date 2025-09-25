# Render Deploy Configuration

PTSI Application - Web Service Configuration

## Environment Variables

- `NODE_ENV=production`
- `PORT=3000` (Render will set this automatically)

## Build Commands

- Build: `npm install`
- Start: `npm start`

## Health Check

The application runs on the configured PORT and responds to HTTP requests.

## Static Files

All static files are served from the application root directory.

## Database

Uses CSV file system for data storage (included in deployment).