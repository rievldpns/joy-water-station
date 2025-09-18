# Backend Testing and Fixes TODO

## User Authentication and Profile
- [ ] Test user registration with valid data
- [ ] Test registration with duplicate username/email (expect error)
- [ ] Test user login with correct credentials
- [ ] Test login with incorrect credentials (expect error)
- [ ] Test login with blocked user (expect error)
- [ ] Test fetching user profile with valid token
- [ ] Test fetching profile with missing/invalid token (expect error)
- [ ] Test updating user profile with valid data
- [ ] Test updating profile with duplicate username/email (expect error)
- [ ] Test changing password with correct current password
- [ ] Test changing password with incorrect current password (expect error)

## Admin Routes
- [ ] Test fetching all users with admin token
- [ ] Test fetching all users with non-admin token (expect error)
- [ ] Test blocking a user with admin token
- [ ] Test unblocking a user with admin token
- [ ] Test blocking/unblocking with non-admin token (expect error)

## Token and Authorization
- [ ] Test access to protected routes without token (expect error)
- [ ] Test access with invalid/expired token (expect error)

## Error Handling and Edge Cases
- [ ] Verify proper error messages and status codes
- [ ] Check for any unhandled exceptions or crashes

## Fixes and Improvements
- [ ] Address any bugs or issues found during testing
- [ ] Improve error messages if needed
- [ ] Ensure consistent JWT_SECRET usage and token expiration

---

After completing these tests and fixes, confirm backend stability and readiness for frontend integration.
