# DevLens Backend

Backend API for DevLens - A repository analysis and metrics tool.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Configuration and environment variables
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # Database models
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py          # Authentication routes
│   └── utils/
│       ├── __init__.py
│       ├── auth.py          # Authentication utilities (bcrypt, JWT)
│       └── database.py      # Database connection and session
├── tests/                   # Test files
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── .env                     # Environment variables (DO NOT COMMIT)
├── .env.example             # Example environment file
├── requirements.txt         # Python dependencies
├── server.py                # Server entry point
└── README.md                # This file
```

## Features

- ✅ User registration with secure password hashing (bcrypt)
- ✅ User login with JWT authentication
- ✅ Password strength validation
- ✅ CORS configuration for frontend integration
- ✅ MySQL database integration with SQLAlchemy
- ✅ Environment-based configuration
- ✅ Organized package structure

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate     # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_USER=devlens_db_user
DB_PASSWORD=DevlensUser@pass123
DB_HOST=localhost
DB_NAME=devlens_db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 4. Set Up Database

Make sure MySQL is running and create the database:

```sql
CREATE DATABASE devlens_db;
CREATE USER 'devlens_db_user'@'localhost' IDENTIFIED BY 'DevlensUser@pass123';
GRANT ALL PRIVILEGES ON devlens_db.* TO 'devlens_db_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Run the Server

```bash
# Using the server entry point
python server.py

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication

#### Register New User
```
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <access_token>

Response:
{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <access_token>
```

### Other Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Security Features

1. **Password Hashing**: Uses bcrypt with salt for secure password storage
2. **JWT Tokens**: Stateless authentication with configurable expiration
3. **Password Validation**: Enforces strong password requirements
4. **CORS Protection**: Configured allowed origins
5. **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
6. **Input Validation**: Pydantic models validate all input data

## Development

### Run Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black app/
```

### Linting
```bash
flake8 app/
```

## Migration from Old Structure

The backend has been reorganized from a flat structure to a proper package structure:

**Old Structure:**
```
backend/
├── auth.py
├── main.py
├── models.py
├── database.py
└── ...
```

**New Structure:**
```
backend/
├── app/
│   ├── routes/
│   ├── models/
│   ├── utils/
│   └── config/
└── server.py
```

### Benefits:
- Better organization and maintainability
- Clear separation of concerns
- Easier to scale and add new features
- Professional package structure
- Easier testing and imports

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env` file
- Ensure database exists

### Import Errors
- Make sure you're in the virtual environment
- Install all dependencies: `pip install -r requirements.txt`
- Run from the backend directory

### CORS Issues
- Check `allow_origins` in `app/main.py`
- Make sure frontend URL is included

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

[Add your license here]
