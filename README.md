# Go go goooo's UM Code Fest 2025 Repository

## Backend Authentication API

This project includes a FastAPI backend for user authentication using MongoDB.

### Setup

1. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Run the server:
   ```
   python run.py
   ```

   The API will be available at http://localhost:8000

### API Endpoints

- `POST /auth/signup` - Register a new user with email and password
- `POST /auth/login` - Login with email and password, returns JWT token
- `GET /auth/users/me` - Get current user info (requires authentication)

### Example Usage

#### Sign Up
```bash
curl -X POST "http://localhost:8000/auth/signup" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password123"}'
```

#### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password123"}'
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Get User Info
```bash
curl -X GET "http://localhost:8000/auth/users/me" \
     -H "Authorization: Bearer <access_token>"
```

## Frontend Integration

The frontend is built with Next.js and connects to the backend API.

### Running the Frontend

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

### Authentication Flow

- The login screen (`components/gosense/login-screen.tsx`) handles both signup and login
- On successful authentication, the JWT token is stored in localStorage
- The `onLogin` callback is called to transition to the main app

### API Integration

The frontend uses fetch to communicate with the backend. CORS is configured to allow requests from `http://localhost:3000`.
