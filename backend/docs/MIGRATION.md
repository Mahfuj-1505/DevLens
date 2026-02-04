# Migration Guide: Old Structure → New Structure

This guide explains how to migrate from the old backend structure to the new organized package structure.

## What Changed?

### Old Structure
```
backend/
├── auth.py                  # Authentication routes
├── main.py                  # Main FastAPI app
├── models.py                # Database models
├── database.py              # Database connection
├── auth_utils.py            # Auth utilities
└── requirements.txt
```

### New Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py          # Authentication routes
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # Database models
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── auth.py          # Auth utilities
│   │   └── database.py      # Database connection
│   └── config/
│       ├── __init__.py
│       └── settings.py      # Configuration
├── server.py                # Server entry point
└── requirements.txt
```

## Benefits of New Structure

1. **Better Organization**: Clear separation of concerns
2. **Scalability**: Easy to add new features
3. **Maintainability**: Code is easier to find and update
4. **Professional**: Follows Python package best practices
5. **Testing**: Easier to write and organize tests

## How to Use the New Structure

### Running the Server

**Old way:**
```bash
uvicorn main:app --reload
```

**New way:**
```bash
# Option 1: Using server.py
python server.py

# Option 2: Using uvicorn directly
uvicorn app.main:app --reload
```

### Importing Modules

**Old way:**
```python
from auth import router as auth_router
from models import User
from database import get_db
from auth_utils import hash_password
```

**New way:**
```python
from app.routes.auth import router as auth_router
from app.models.user import User
from app.utils.database import get_db
from app.utils.auth import hash_password
```

## Key Improvements

### 1. Password Hashing
- ❌ Old: MD5 (insecure)
- ✅ New: Bcrypt with salt (secure)

### 2. Configuration Management
- ❌ Old: Hardcoded values, scattered config
- ✅ New: Centralized in `app/config/settings.py` with Pydantic

### 3. CORS Setup
- ❌ Old: Not configured
- ✅ New: Properly configured in `app/main.py`

### 4. Database Models
- ❌ Old: Split between `models.py` and `db_connect/model.py`
- ✅ New: Unified in `app/models/user.py`

### 5. Code Organization
- ❌ Old: All files in one directory
- ✅ New: Organized by feature (routes, models, utils)

## Migration Steps

If you're actively using the old structure, follow these steps:

### 1. Backup Current Code
```bash
cp -r backend backend_old
```

### 2. Keep Old Files (For Reference)
The old files are still in the backend root directory:
- `auth.py`
- `main.py`
- `models.py`
- `database.py`
- `auth_utils.py`

### 3. Update Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Update Database Connection
The new structure uses the same database, but ensure your `.env` is configured:
```env
DB_USER=devlens_db_user
DB_PASSWORD=DevlensUser@pass123
DB_HOST=localhost
DB_NAME=devlens_db
```

### 5. Test the New Structure
```bash
# Start the new server
python server.py

# Test registration
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'

# Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 6. Update Frontend API Calls
Frontend is already updated to use the new endpoints:
- Registration: `POST /auth/register`
- Login: `POST /auth/login`
- Get user: `GET /auth/me`

### 7. Verify Everything Works
1. Start backend: `python server.py`
2. Start frontend: `cd frontend && npm run dev`
3. Test registration and login

## Common Issues & Solutions

### Import Errors
**Problem**: `ModuleNotFoundError: No module named 'app'`

**Solution**: 
- Run from backend directory: `cd backend`
- Use correct command: `python server.py` or `uvicorn app.main:app --reload`

### Database Connection
**Problem**: Can't connect to database

**Solution**:
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists: `CREATE DATABASE devlens_db;`

### Password Hashing
**Problem**: Old passwords (MD5) won't work

**Solution**:
- Users need to re-register with the new system
- Or run a migration script to rehash passwords (not recommended)
- Best practice: Users reset passwords

## Cleanup (Optional)

After verifying the new structure works, you can optionally remove old files:

```bash
# Move old files to archive
mkdir backend/archive
mv backend/auth.py backend/archive/
mv backend/main.py backend/archive/
mv backend/models.py backend/archive/
mv backend/database.py backend/archive/
mv backend/auth_utils.py backend/archive/
```

**Note**: Keep the old files until you're 100% confident everything works!

## Need Help?

- Check `docs/README.md` for detailed API documentation
- Check `README.md` in project root for setup instructions
- Review code examples in `app/routes/auth.py`

## Rollback Plan

If you need to rollback to the old structure:

```bash
# Stop new server
# Start old server
cd backend
uvicorn main:app --reload
```

The old files are still present and functional (though they use MD5 hashing).

---

**Note**: The new structure is production-ready and follows industry best practices. All new development should use the new structure.
