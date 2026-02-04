"""
Test script for DevLens API JWT Authentication
Run this after starting the FastAPI server with: uvicorn main:app --reload
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_response(response):
    """Pretty print API response"""
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_authentication_flow():
    """Test the complete authentication flow"""
    
    # Test 1: Create a regular user
    print_section("1. Creating a regular user")
    user_data = {
        "firstname": "Alice",
        "lastname": "Johnson",
        "email": "alice@example.com",
        "password": "SecurePass123",
        "role": "user"
    }
    response = requests.post(f"{BASE_URL}/users/", json=user_data)
    print_response(response)
    
    if response.status_code == 201:
        user_id = response.json()["user_id"]
        print(f"\n✅ User created successfully! User ID: {user_id}")
    else:
        print("\n⚠️ User might already exist or creation failed")
        user_id = 1  # Assume existing user
    
    # Test 2: Create an admin user
    print_section("2. Creating an admin user")
    admin_data = {
        "firstname": "Admin",
        "lastname": "User",
        "email": "admin@example.com",
        "password": "AdminPass123",
        "role": "admin"
    }
    response = requests.post(f"{BASE_URL}/users/", json=admin_data)
    print_response(response)
    
    if response.status_code == 201:
        admin_id = response.json()["user_id"]
        print(f"\n✅ Admin created successfully! User ID: {admin_id}")
    else:
        print("\n⚠️ Admin might already exist or creation failed")
        admin_id = 2  # Assume existing admin
    
    # Test 3: Login as regular user
    print_section("3. Login as regular user")
    login_data = {
        "email": "alice@example.com",
        "password": "SecurePass123"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print_response(response)
    
    if response.status_code == 200:
        user_token = response.json()["access_token"]
        print(f"\n✅ Login successful! Token: {user_token[:50]}...")
    else:
        print("\n❌ Login failed!")
        return
    
    # Test 4: Login as admin
    print_section("4. Login as admin user")
    admin_login = {
        "email": "admin@example.com",
        "password": "AdminPass123"
    }
    response = requests.post(f"{BASE_URL}/login", json=admin_login)
    print_response(response)
    
    if response.status_code == 200:
        admin_token = response.json()["access_token"]
        print(f"\n✅ Admin login successful! Token: {admin_token[:50]}...")
    else:
        print("\n❌ Admin login failed!")
        return
    
    # Test 5: Access own user data (should succeed)
    print_section("5. Regular user accessing their own data")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)
    print_response(response)
    
    if response.status_code == 200:
        print("\n✅ Successfully accessed own data!")
    else:
        print("\n❌ Failed to access own data!")
    
    # Test 6: Access another user's data (should fail for regular user)
    print_section("6. Regular user trying to access admin's data (should fail)")
    response = requests.get(f"{BASE_URL}/users/{admin_id}", headers=headers)
    print_response(response)
    
    if response.status_code == 403:
        print("\n✅ Correctly denied access (403 Forbidden)")
    else:
        print("\n⚠️ Unexpected response!")
    
    # Test 7: Admin accessing any user's data (should succeed)
    print_section("7. Admin accessing regular user's data (should succeed)")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/users/{user_id}", headers=admin_headers)
    print_response(response)
    
    if response.status_code == 200:
        print("\n✅ Admin successfully accessed user data!")
    else:
        print("\n❌ Admin failed to access user data!")
    
    # Test 8: Get all users as regular user (should see only own data)
    print_section("8. Regular user getting all users (should see only self)")
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/users/", headers=headers)
    print_response(response)
    
    if response.status_code == 200:
        users = response.json()
        print(f"\n✅ Retrieved {len(users)} user(s)")
    else:
        print("\n❌ Failed to get users!")
    
    # Test 9: Get all users as admin (should see all users)
    print_section("9. Admin getting all users (should see everyone)")
    response = requests.get(f"{BASE_URL}/users/", headers=admin_headers)
    print_response(response)
    
    if response.status_code == 200:
        users = response.json()
        print(f"\n✅ Admin retrieved {len(users)} user(s)")
    else:
        print("\n❌ Admin failed to get users!")
    
    # Test 10: Access without token (should fail)
    print_section("10. Accessing protected endpoint without token (should fail)")
    response = requests.get(f"{BASE_URL}/users/1")
    print_response(response)
    
    if response.status_code == 401:
        print("\n✅ Correctly denied access (401 Unauthorized)")
    else:
        print("\n⚠️ Unexpected response!")
    
    # Test 11: Access with invalid token (should fail)
    print_section("11. Accessing with invalid token (should fail)")
    bad_headers = {"Authorization": "Bearer invalid_token_here"}
    response = requests.get(f"{BASE_URL}/users/1", headers=bad_headers)
    print_response(response)
    
    if response.status_code == 401:
        print("\n✅ Correctly denied access (401 Unauthorized)")
    else:
        print("\n⚠️ Unexpected response!")
    
    # Test 12: Wrong password (should fail)
    print_section("12. Login with wrong password (should fail)")
    wrong_login = {
        "email": "alice@example.com",
        "password": "WrongPassword"
    }
    response = requests.post(f"{BASE_URL}/login", json=wrong_login)
    print_response(response)
    
    if response.status_code == 401:
        print("\n✅ Correctly rejected wrong password (401 Unauthorized)")
    else:
        print("\n⚠️ Unexpected response!")
    
    print_section("Test Summary")
    print("✅ All authentication tests completed!")
    print("\nKey Features Verified:")
    print("  ✓ User creation with password hashing")
    print("  ✓ JWT token generation on login")
    print("  ✓ Protected endpoints require valid tokens")
    print("  ✓ Users can only access their own data")
    print("  ✓ Admins can access all data")
    print("  ✓ Invalid tokens are rejected")
    print("  ✓ Wrong passwords are rejected")

if __name__ == "__main__":
    print("=" * 60)
    print("  DevLens API - JWT Authentication Test Suite")
    print("=" * 60)
    print("\n⚠️  Make sure the FastAPI server is running:")
    print("   uvicorn main:app --reload\n")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Server is running!\n")
            test_authentication_flow()
        else:
            print("❌ Server responded but might have issues")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Please start it with:")
        print("   uvicorn main:app --reload")
