# Backend Testing Instructions for MySQL Connection and JWT Authentication

This document provides step-by-step instructions to test the backend API endpoints related to user registration, login, and profile retrieval. These tests verify the MySQL connection, JWT token generation, and token authentication.

---

## 1. Register a New User

Send a POST request to `/register` with user details in JSON format.

```bash
curl -X POST http://localhost:5000/users/register \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "TestPassword123",
  "firstName": "Test",
  "lastName": "User"
}'
```

Expected result: JSON response with a JWT token and user data.

---

## 2. Login with the Registered User

Send a POST request to `/login` with username/email and password.

```bash
curl -X POST http://localhost:5000/users/login \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "password": "TestPassword123"
}'
```

Expected result: JSON response with a JWT token and user data.

---

## 3. Get User Profile with JWT Token

Use the JWT token from login or register response to access the protected `/profile` endpoint.

```bash
curl -X GET http://localhost:5000/users/profile \
-H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

Replace `YOUR_JWT_TOKEN_HERE` with the actual token string.

Expected result: JSON response with the user's profile data.

---

## Notes

- Ensure the backend server is running on `http://localhost:5000` or adjust the URL accordingly.
- If any request fails, check backend logs for errors related to MySQL connection or JWT verification.
- These tests cover critical paths for database connection and authentication.

---

If you want me to help automate these tests or test additional endpoints, please let me know.
