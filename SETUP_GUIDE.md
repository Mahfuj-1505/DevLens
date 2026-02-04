# DevLens - Complete Setup and Testing Guide

## 🎯 What Has Been Implemented

### ✅ Backend Security & Authentication
1. **Secure Password Hashing**: Replaced insecure MD5 with bcrypt
2. **JWT Authentication**: Token-based authentication with configurable expiration
3. **Password Validation**: Strong password requirements (uppercase, lowercase, numbers, min 6 chars)
4. **CORS Configuration**: Properly configured for frontend-backend communication

### ✅ Project Reorganization
- Moved from flat structure to professional package structure
- Organized code into: routes, models, utils, config
- Clear separation of concerns
- Easy to scale and maintain

### ✅ Frontend Integration
- Registration page now calls backend API
- Login page now calls backend API
- JWT token stored in localStorage
- Proper error handling and user feedback

### ✅ Database Integration
- SQLAlchemy ORM for database operations
- Pydantic models for data validation
- Environment-based configuration
- Proper database session management

## 🚀 Quick Start

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd /home/mahfuj/Documents/DevLens/backend

# Run automated setup (recommended)
./scripts/setup.sh

# Or manual setup:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Database Setup

```bash
# Start MySQL
sudo systemctl start mysql

# Create database and user
mysql -u root -p
```

```sql
CREATE DATABASE devlens_db;
CREATE USER 'devlens_db_user'@'localhost' IDENTIFIED BY 'DevlensUser@pass123';
GRANT ALL PRIVILEGES ON devlens_db.* TO 'devlens_db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Configure Environment

The `.env` file is already configured, but verify it contains:

```env
DB_USER=devlens_db_user
DB_PASSWORD=DevlensUser@pass123
DB_HOST=localhost
DB_NAME=devlens_db

SECRET_KEY=devlens-super-secret-key-change-this-in-production-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

HOST=0.0.0.0
PORT=8000
```

### Step 4: Start Backend Server

```bash
# Make sure you're in the backend directory and venv is activated
cd /home/mahfuj/Documents/DevLens/backend
source venv/bin/activate  # if not already activated

# Start server
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 5: Verify Backend

Open another terminal and test:

```bash
# Test root endpoint
curl http://localhost:8000/

# Test health check
curl http://localhost:8000/health

# View API documentation
# Open in browser: http://localhost:8000/docs
```

### Step 6: Start Frontend

```bash
# Open new terminal
cd /home/mahfuj/Documents/DevLens/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

You should see:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 7: Test the Application

1. **Open Frontend**: http://localhost:5173
2. **Register a New User**:
   - Click "Create Account"
   - Fill in details:
     - First Name: Test
     - Last Name: User
     - Email: test@example.com
     - Password: TestPass123 (must have uppercase, lowercase, number)
     - Confirm Password: TestPass123
   - Click "Create Account"
   - You should see "Registration successful!"

3. **Login**:
   - Enter email: test@example.com
   - Enter password: TestPass123
   - Click "Login"
   - You should be logged in successfully

## 🧪 Testing

### Manual API Testing with cURL

```bash
# 1. Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'

# 2. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'

# Save the token from response
TOKEN="<your-token-here>"

# 3. Get current user info
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Logout
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Testing with pytest

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Test with Swagger UI

1. Open http://localhost:8000/docs
2. Try the endpoints interactively
3. View request/response examples
4. Test authentication flow

## 📁 File Structure Reference

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS config
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py          # Registration, Login, Me endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # User, Repository, Report models
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── auth.py          # Bcrypt hashing, JWT tokens
│   │   └── database.py      # SQLAlchemy connection
│   └── config/
│       ├── __init__.py
│       └── settings.py      # Environment config
├── tests/
│   ├── __init__.py
│   └── test_auth.py         # Auth endpoint tests
├── docs/
│   ├── README.md            # Detailed backend docs
│   └── MIGRATION.md         # Migration guide
├── scripts/
│   └── setup.sh             # Automated setup script
├── .env                     # Environment variables
├── server.py                # Server entry point
└── requirements.txt         # Python dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/
│   │   ├── login_pages/
│   │   │   └── Login.jsx          # ✅ Updated to call backend
│   │   └── registration_pages/
│   │       └── Registration.jsx   # ✅ Updated to call backend
│   ├── api.js                     # API configuration
│   └── App.jsx
└── package.json
```

## 🔑 Key Changes Made

### 1. Backend Security
**Before**: MD5 hashing (insecure)
```python
hashlib.md5(password.encode()).hexdigest()
```

**After**: Bcrypt hashing (secure)
```python
pwd_context = CryptContext(schemes=["bcrypt"])
pwd_context.hash(password)
```

### 2. Frontend Registration
**Before**: Mock setTimeout
```javascript
setTimeout(() => {
    setSuccessMessage("Registration successful!");
}, 1500);
```

**After**: Real API call
```javascript
const response = await fetch(`${api.baseURL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
});
```

### 3. Frontend Login
**Before**: Mock user array
```javascript
const mockUsers = [...];
const user = mockUsers.find(u => u.email === formData.email);
```

**After**: Real API call with JWT
```javascript
const response = await fetch(`${api.baseURL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
});
localStorage.setItem("access_token", data.access_token);
```

## 🐛 Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'app'`
**Solution**: Make sure you're running from the backend directory
```bash
cd /home/mahfuj/Documents/DevLens/backend
python server.py
```

**Error**: `Can't connect to MySQL server`
**Solution**: 
```bash
sudo systemctl start mysql
mysql -u root -p  # Verify it's running
```

**Error**: `Access denied for user 'devlens_db_user'`
**Solution**: Recreate the database user (see Step 2 above)

### Frontend can't connect to backend

**Error**: `Failed to fetch` or CORS error
**Solution**: 
1. Verify backend is running on port 8000
2. Check CORS configuration in `app/main.py`
3. Verify `api.baseURL` in `frontend/src/api.js`

### Registration/Login not working

**Issue**: "Invalid email or password"
**Solution**: 
1. Check database connection
2. Verify user was created: `SELECT * FROM users;` in MySQL
3. Check browser console for errors
4. Verify password meets requirements (uppercase, lowercase, number, min 6 chars)

### Old users can't login

**Issue**: Users created with old MD5 system can't login
**Solution**: 
- This is expected! Old passwords were hashed with MD5
- New system uses bcrypt (much more secure)
- Users need to re-register with the new system

## 📊 Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Can access http://localhost:5173
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] JWT token is stored in localStorage
- [ ] Can view API docs at /docs
- [ ] Database tables are created
- [ ] CORS works (no console errors)

## 📚 Next Steps

1. **Add More Features**:
   - Repository analysis endpoints
   - User dashboard
   - Report generation

2. **Improve Security**:
   - Change SECRET_KEY in production
   - Add rate limiting
   - Implement email verification

3. **Deploy**:
   - Set up production database
   - Configure reverse proxy
   - Use environment-specific configs

## 📖 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Backend Details**: `backend/docs/README.md`
- **Migration Guide**: `backend/docs/MIGRATION.md`
- **Project README**: Root `README.md`

## 🎉 Success!

If you can register and login, congratulations! Your DevLens application is now:
- ✅ Securely hashing passwords with bcrypt
- ✅ Using JWT authentication
- ✅ Properly organized in a professional structure
- ✅ Connected frontend to backend
- ✅ Ready for further development

---

**Need help?** Check the documentation or review the code comments in:
- `backend/app/routes/auth.py` - Authentication logic
- `backend/app/utils/auth.py` - Password hashing and JWT
- `frontend/src/pages/login_pages/Login.jsx` - Login implementation
- `frontend/src/pages/registration_pages/Registration.jsx` - Registration implementation
