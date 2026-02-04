"""
Test authentication endpoints
Run with: pytest tests/test_auth.py
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint returns correct response"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "Welcome to DevLens API"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_register_user_success():
    """Test successful user registration"""
    test_user = {
        "firstName": "Test",
        "lastName": "User",
        "email": f"test_{pytest.timestamp}@example.com",
        "password": "TestPass123",
        "confirmPassword": "TestPass123"
    }
    
    response = client.post("/auth/register", json=test_user)
    assert response.status_code == 201
    assert "message" in response.json()
    assert "user" in response.json()


def test_register_user_password_mismatch():
    """Test registration fails with password mismatch"""
    test_user = {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "TestPass123",
        "confirmPassword": "DifferentPass123"
    }
    
    response = client.post("/auth/register", json=test_user)
    assert response.status_code == 400
    assert "do not match" in response.json()["detail"]


def test_register_user_weak_password():
    """Test registration fails with weak password"""
    test_user = {
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "weak",
        "confirmPassword": "weak"
    }
    
    response = client.post("/auth/register", json=test_user)
    assert response.status_code == 400


def test_login_invalid_credentials():
    """Test login fails with invalid credentials"""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "WrongPass123"
    }
    
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_current_user_no_token():
    """Test getting current user without token fails"""
    response = client.get("/auth/me")
    assert response.status_code == 401


# Setup for tests
@pytest.fixture(scope="session", autouse=True)
def setup_tests():
    """Setup test environment"""
    import time
    pytest.timestamp = int(time.time())
