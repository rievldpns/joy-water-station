# Joy Water Station - User Management System

A full-stack user management system with React frontend and Node.js/Express backend with MySQL database.

## Features

- User registration and authentication
- JWT-based session management
- User profile management
- Password change functionality
- Admin user management (block/unblock users)
- Responsive UI with Tailwind CSS

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

### 1. Database Setup

1. Install and start MySQL server
2. Create a database named `joy_water_station`
3. Update the database credentials in `backend/.env`:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=joy_water_station
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. Run the database schema:
   ```bash
   mysql -u your_username -p joy_water_station < backend/schema.sql
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd joy-water-station/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd joy-water-station/joy-water-station
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Public Routes
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### Protected Routes (require JWT token)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `GET /api/users/all` - Get all users (admin only)
- `PUT /api/users/:userId/block` - Block user (admin only)
- `PUT /api/users/:userId/unblock` - Unblock user (admin only)

## Default Admin Account

- Username: `admin`
- Email: `admin@joywater.com`
- Password: `admin123`

## Troubleshooting

### Authentication Issues

If refreshing the page logs you out:

1. **Check if backend is running**: Ensure the backend server is running on port 5000
2. **Verify database connection**: Check that MySQL is running and credentials are correct
3. **Check JWT token**: Open browser developer tools → Application → Local Storage and verify the token exists
4. **API connectivity**: Test the API endpoint directly:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users/profile
   ```

### Database Connection Issues

1. Ensure MySQL server is running
2. Verify database credentials in `.env`
3. Check that the database `joy_water_station` exists
4. Run the schema file to create tables

### Port Conflicts

If port 3000 or 5000 is already in use, you can change them in:
- Frontend: `package.json` scripts or create `.env` file
- Backend: `.env` file (PORT variable)

## Project Structure

```
joy-water-station/
├── backend/
│   ├── controllers/
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── db.js
│   ├── schema.sql
│   ├── server.js
│   ├── package.json
│   └── .env
├── joy-water-station/ (frontend)
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Technologies Used

- **Frontend**: React, Tailwind CSS, Lucide React icons
- **Backend**: Node.js, Express.js, MySQL2, bcrypt, JWT
- **Database**: MySQL
