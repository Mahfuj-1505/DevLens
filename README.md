# DevLens 🔍

A comprehensive repository analysis and metrics tool for software development teams.

## Project Overview

DevLens is a full-stack web application that helps developers analyze their Git repositories, track metrics, and gain insights into code quality, commit activity, and development patterns.

## Features

- 🔐 **Secure Authentication**: User registration and login with bcrypt password hashing and JWT tokens
- 📊 **Repository Analysis**: Analyze GitHub repositories for metrics and insights
- 📈 **Metrics Dashboard**: Visualize code metrics, complexity, and commit activity
- 👤 **User Management**: Personal dashboard to track analysis history
- 🎨 **Modern UI**: Clean and responsive interface built with React

## Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **CSS3** - Styling

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **MySQL** - Database
- **Bcrypt** - Password hashing
- **JWT** - Token-based authentication
- **Pydantic** - Data validation

## Project Structure

```
DevLens/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── api.js           # API configuration
│   │   └── App.jsx          # Main app component
│   └── package.json
│
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Database models
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration
│   │   └── main.py         # FastAPI app
│   ├── tests/              # Test files
│   ├── docs/               # Documentation
│   ├── scripts/            # Setup and utility scripts
│   ├── server.py           # Server entry point
│   └── requirements.txt    # Python dependencies
│
└── README.md               # This file
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Run setup script** (Linux/Mac)
   ```bash
   ./scripts/setup.sh
   ```
   
   Or manually:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up MySQL database**
   ```sql
   CREATE DATABASE devlens_db;
   CREATE USER 'devlens_db_user'@'localhost' IDENTIFIED BY 'DevlensUser@pass123';
   GRANT ALL PRIVILEGES ON devlens_db.* TO 'devlens_db_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Run the backend server**
   ```bash
   python server.py
   ```
   
   Backend will be available at: http://localhost:8000
   API docs: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at: http://localhost:5173

## Usage

1. **Register an account**
   - Open http://localhost:5173
   - Click "Create Account"
   - Fill in your details (password must be 8+ chars with uppercase, lowercase, and number)

2. **Login**
   - Enter your email and password
   - You'll receive a JWT token that's stored in localStorage

3. **Analyze repositories**
   - Enter a GitHub repository URL
   - View metrics and insights

## API Documentation

### Authentication Endpoints

#### Register
```http
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
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

For complete API documentation, visit http://localhost:8000/docs after starting the backend.

## Security Features

- ✅ **Password Hashing**: Bcrypt with salt
- ✅ **JWT Authentication**: Stateless token-based auth
- ✅ **Password Validation**: Strong password requirements
- ✅ **CORS Protection**: Configured allowed origins
- ✅ **SQL Injection Prevention**: SQLAlchemy ORM
- ✅ **Input Validation**: Pydantic models

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run server with auto-reload
python server.py

# Run tests
pytest tests/

# Format code
black app/
```

### Frontend Development

```bash
cd frontend

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

### Backend (.env)
```env
DB_USER=devlens_db_user
DB_PASSWORD=DevlensUser@pass123
DB_HOST=localhost
DB_NAME=devlens_db
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
HOST=0.0.0.0
PORT=8000
```

### Frontend
Update `api.js` with your backend URL:
```javascript
const api = {
    baseURL: "http://127.0.0.1:8000"
};
```

## Troubleshooting

### Backend Issues

**Database connection error**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env`
- Ensure database exists

**Import errors**
- Activate virtual environment: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

**Port already in use**
- Change PORT in `.env` file
- Kill existing process: `lsof -ti:8000 | xargs kill -9`

### Frontend Issues

**API connection failed**
- Verify backend is running on port 8000
- Check CORS configuration in backend
- Verify `api.baseURL` in frontend/src/api.js

**Module not found**
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Roadmap

- [ ] GitHub OAuth integration
- [ ] Real-time repository analysis
- [ ] Code quality metrics
- [ ] Team collaboration features
- [ ] Export reports to PDF
- [ ] Email notifications
- [ ] CI/CD pipeline integration

## License

[Add your license here]

## Contact

- **Project**: DevLens
- **Repository**: https://github.com/Mahfuj-1505/DevLens

## Acknowledgments

- FastAPI for the amazing web framework
- React team for the UI library
- All open source contributors

---

Made with ❤️ by the DevLens Team
