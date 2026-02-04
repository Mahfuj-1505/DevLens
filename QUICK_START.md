# 🚀 DevLens Quick Reference

## ⚡ Quick Start

```bash
# From DevLens root directory
./start.sh
```

Or manually:

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python server.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Main application |
| Backend | http://localhost:8000 | API server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| ReDoc | http://localhost:8000/redoc | Alternative docs |

---

## 📡 API Endpoints

### Registration
```bash
POST /auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

### Login
```bash
POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {...}
}
```

### Get Current User
```bash
GET /auth/me
Authorization: Bearer <token>
```

### Logout
```bash
POST /auth/logout
Authorization: Bearer <token>
```

---

## 🔑 Password Requirements

✅ **Valid Passwords:**
- `SecurePass123` ✓
- `TestUser456` ✓
- `MyPassword789` ✓

❌ **Invalid Passwords:**
- `weak` - Too short
- `nouppercasepass123` - No uppercase
- `NOLOWERCASEPASS123` - No lowercase
- `NoNumbers` - No digits

**Requirements:**
- Minimum 6 characters (8+ recommended)
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

---

## 📁 Key Files

### Backend
```
backend/
├── server.py           # Start here
├── app/
│   ├── main.py        # FastAPI app
│   ├── routes/
│   │   └── auth.py    # Auth endpoints
│   ├── models/
│   │   └── user.py    # Database models
│   ├── utils/
│   │   ├── auth.py    # Bcrypt, JWT
│   │   └── database.py # SQLAlchemy
│   └── config/
│       └── settings.py # Config
└── .env                # Environment
```

### Frontend
```
frontend/
├── src/
│   ├── pages/
│   │   ├── login_pages/Login.jsx
│   │   └── registration_pages/Registration.jsx
│   └── api.js         # API config
```

---

## 🗄️ Database

### Quick Commands
```sql
-- View all users
SELECT * FROM users;

-- Check user count
SELECT COUNT(*) FROM users;

-- Verify password hashing (should see $2b$)
SELECT email, SUBSTRING(password, 1, 10) FROM users;

-- Delete test user
DELETE FROM users WHERE email = 'test@example.com';
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
cd /home/mahfuj/Documents/DevLens/backend
source venv/bin/activate
python server.py
```

### Database connection error
```bash
sudo systemctl start mysql
mysql -u root -p
```

### CORS error
Check `app/main.py`:
```python
allow_origins=["http://localhost:5173", ...]
```

### Module not found
```bash
cd backend
pip install -r requirements.txt
```

---

## 🧪 Testing

### Quick Test
```bash
# Backend health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"TestPass123","confirmPassword":"TestPass123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### Run Tests
```bash
cd backend
pytest tests/ -v
```

---

## ⚙️ Configuration

### Backend (.env)
```env
DB_USER=devlens_db_user
DB_PASSWORD=DevlensUser@pass123
DB_HOST=localhost
DB_NAME=devlens_db

SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

HOST=0.0.0.0
PORT=8000
```

### Frontend (api.js)
```javascript
const api = {
    baseURL: "http://127.0.0.1:8000"
};
```

---

## 🔒 Security Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| Password Hashing | Bcrypt | ✅ |
| Authentication | JWT | ✅ |
| Password Validation | Min 6 chars, mixed case, numbers | ✅ |
| CORS | Configured | ✅ |
| SQL Injection | SQLAlchemy ORM | ✅ |
| Input Validation | Pydantic models | ✅ |

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `SETUP_GUIDE.md` | Complete setup instructions |
| `IMPLEMENTATION_SUMMARY.md` | What was done |
| `CHECKLIST.md` | Verification checklist |
| `backend/docs/README.md` | Backend API documentation |
| `backend/docs/MIGRATION.md` | Migration guide |

---

## 🎯 Common Tasks

### Add New User (via Frontend)
1. Open http://localhost:5173
2. Click "Create Account"
3. Fill form and submit

### Get JWT Token
1. Login via frontend OR
2. `POST /auth/login` with email/password
3. Token in response `access_token` field

### Verify User in Database
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Clear All Users
```sql
TRUNCATE TABLE users;
```

### Restart Servers
```bash
# Kill existing processes
pkill -f "python server.py"
pkill -f "npm run dev"

# Restart
./start.sh
```

---

## 💡 Pro Tips

1. **Use Swagger UI** for API testing: http://localhost:8000/docs
2. **Check logs** if errors occur: `backend.log` and `frontend.log`
3. **Use .env.example** as template for new environments
4. **Run tests** before deploying: `pytest tests/`
5. **Change SECRET_KEY** in production!

---

## 🆘 Help

If you're stuck:
1. Check `SETUP_GUIDE.md` → Troubleshooting section
2. Review console/terminal errors
3. Verify database is running
4. Check `.env` configuration
5. Ensure all dependencies are installed

---

## 🎉 Quick Win

Get up and running in 3 commands:

```bash
# 1. Setup backend
cd backend && ./scripts/setup.sh && cd ..

# 2. Setup frontend
cd frontend && npm install && cd ..

# 3. Start everything
./start.sh
```

Then open: http://localhost:5173

---

**That's it! You're ready to use DevLens! 🚀**

---

Last Updated: February 4, 2026
