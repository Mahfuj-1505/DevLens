# DevLens API - JWT Authentication Usage Guide

This guide demonstrates how to use the JWT authentication system in the DevLens API.

## 🔑 Authentication Overview

The API now uses **JWT (JSON Web Token)** authentication with **bcrypt** password hashing for secure user management.

### Key Features:
- ✅ Passwords are hashed with bcrypt before storage
- ✅ JWT tokens for secure authentication
- ✅ Role-based access control (admin vs regular users)
- ✅ Protected endpoints require valid JWT tokens
- ✅ Users can only access their own data (unless admin)

---

## 📝 API Endpoints

### 1. **Create User** (Public)
**POST** `/users/`

Create a new user account. Passwords are automatically hashed.

```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "mypassword123",
    "role": "user"
  }'
```

**Response:**
```json
{
  "user_id": 1,
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "role": "user"
}
```

---

### 2. **Login** (Public)
**POST** `/login`

Authenticate and receive a JWT token.

```bash
curl -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "mypassword123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Important:** Save the `access_token` - you'll need it for protected endpoints!

---

### 3. **Get User by ID** (Protected)
**GET** `/users/{user_id}`

Retrieve a specific user's information. Requires authentication.

**Authorization Rules:**
- Users can only access their own data
- Admin users can access any user's data

```bash
curl -X GET "http://localhost:8000/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "user_id": 1,
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**Error Response (403 Forbidden):**
```json
{
  "detail": "Not authorized to access this resource"
}
```

---

### 4. **Get All Users** (Protected)
**GET** `/users/`

Retrieve all users (behavior depends on user role).

**Authorization Rules:**
- Admin users: See all users
- Regular users: See only their own data

```bash
curl -X GET "http://localhost:8000/users/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response (for admin):**
```json
[
  {
    "user_id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "role": "user"
  },
  {
    "user_id": 2,
    "firstname": "Jane",
    "lastname": "Smith",
    "email": "jane@example.com",
    "role": "admin"
  }
]
```

**Response (for regular user):**
```json
[
  {
    "user_id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "role": "user"
  }
]
```

---

## 🔐 Authentication Flow

### Step-by-Step Example:

#### 1. Create a new user
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Alice",
    "lastname": "Johnson",
    "email": "alice@example.com",
    "password": "securepass123",
    "role": "user"
  }'
```

#### 2. Login to get JWT token
```bash
TOKEN=$(curl -s -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepass123"
  }' | jq -r '.access_token')

echo "Token: $TOKEN"
```

#### 3. Use token to access protected endpoints
```bash
# Get your own user data
curl -X GET "http://localhost:8000/users/1" \
  -H "Authorization: Bearer $TOKEN"

# Get all users (will see only your own data if not admin)
curl -X GET "http://localhost:8000/users/" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛡️ Security Features

### Password Hashing
- Passwords are hashed using **bcrypt** before storage
- Plain text passwords are never stored in the database
- Password column in database increased to 255 characters to store hashed values

### JWT Tokens
- Tokens expire after **30 minutes** (configurable in `auth_utils.py`)
- Tokens include the user's ID in the subject claim
- Secret key should be changed in production (see Configuration section)

### Role-Based Access Control
- **Admin users**: Can access all user data
- **Regular users**: Can only access their own data
- Authorization checked on every protected endpoint request

---

## ⚙️ Configuration

### Important Settings in `auth_utils.py`:

```python
# Change these in production!
SECRET_KEY = "your-secret-key-change-this-in-production-min-32-characters"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

**Production Recommendations:**
1. Generate a secure random secret key:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
2. Store the secret key in environment variables (`.env` file)
3. Never commit the secret key to version control

---

## 🐍 Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Create a user
user_data = {
    "firstname": "Bob",
    "lastname": "Smith",
    "email": "bob@example.com",
    "password": "mypassword123",
    "role": "user"
}
response = requests.post(f"{BASE_URL}/users/", json=user_data)
print("User created:", response.json())

# 2. Login
login_data = {
    "email": "bob@example.com",
    "password": "mypassword123"
}
response = requests.post(f"{BASE_URL}/login", json=login_data)
token = response.json()["access_token"]
print("Token received:", token)

# 3. Access protected endpoint
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/users/1", headers=headers)
print("User data:", response.json())
```

---

## 🚨 Error Responses

### 401 Unauthorized
Returned when authentication fails or token is invalid/missing.
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
Returned when user doesn't have permission to access a resource.
```json
{
  "detail": "Not authorized to access this resource"
}
```

### 404 Not Found
Returned when requested user doesn't exist.
```json
{
  "detail": "User not found"
}
```

---

## 📋 Testing with Swagger UI

1. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

2. Open Swagger UI: http://localhost:8000/docs

3. Create a user using POST `/users/`

4. Login using POST `/login` and copy the access token

5. Click the "Authorize" button (🔒) at the top right

6. Enter: `Bearer YOUR_TOKEN_HERE`

7. Now you can access protected endpoints!

---

## 🔄 Database Migration

**Important:** The password column length was increased from 50 to 255 characters to accommodate bcrypt hashes.

If you have an existing database, run this SQL migration:

```sql
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL;
```

Or recreate the tables:
```python
from database import engine, Base
from models import User, Repository, Report, Compares

# Drop all tables and recreate
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
```

---

## 📦 Dependencies

Make sure you have these packages installed:

```bash
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv PyJWT email-validator python-multipart bcrypt passlib[bcrypt] python-jose[cryptography]
```

Or use the updated `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## 🎯 Quick Start Checklist

- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Update database password column: `ALTER TABLE users MODIFY password VARCHAR(255)`
- [ ] Change SECRET_KEY in `auth_utils.py` to a secure random value
- [ ] Start the server: `uvicorn main:app --reload`
- [ ] Create a user via POST `/users/`
- [ ] Login via POST `/login` to get JWT token
- [ ] Use the token in Authorization header for protected endpoints

---

## 🔧 File Structure

```
backend/
├── main.py              # FastAPI app with protected endpoints
├── auth_utils.py        # JWT and password hashing utilities
├── models.py            # SQLAlchemy models (User password column: 255 chars)
├── database.py          # Database connection
├── requirements.txt     # Updated with bcrypt and passlib
└── API_USAGE.md         # This file
```

---

## 💡 Tips

1. **Tokens expire after 30 minutes** - Users need to login again to get a new token
2. **Admin users** have full access - Use role="admin" when creating admin users
3. **Always use HTTPS in production** to protect tokens in transit
4. **Store tokens securely** on the client side (e.g., httpOnly cookies, secure storage)
5. **Validate user input** - The API includes basic validation, consider adding more

---

**Happy coding! 🚀**
