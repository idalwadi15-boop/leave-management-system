# Online Leave Management System

A comprehensive web-based leave management system built with HTML, CSS, Node.js, and MySQL.

## Features

### User Features
- ✅ User registration and login
- ✅ Apply for leave with various types (Sick, Casual, Annual, Emergency, etc.)
- ✅ View leave status (Pending, Approved, Rejected)
- ✅ Edit or cancel pending leave applications
- ✅ View complete leave history
- ✅ Real-time statistics dashboard
- ✅ Responsive and user-friendly interface

### Admin Features
- ✅ Secure admin login
- ✅ View all leave applications
- ✅ Filter leaves by status
- ✅ Search users by name or email
- ✅ Approve or reject leave applications
- ✅ Add admin remarks to leave decisions
- ✅ View comprehensive statistics
- ✅ Dashboard with real-time data

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, Font Awesome
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Session Management**: Express Session
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (Already installed)
- Modern web browser (Chrome, Firefox, Edge, etc.)

## Installation & Setup

### 1. Install Node.js Dependencies

Open PowerShell in the project directory and run:

```powershell
cd backend
npm install
```

### 2. Database Configuration

The system is configured to use:
- **Host**: localhost
- **Port**: 3306
- **Username**: admin
- **Password**: admin
- **Database**: leave_management (will be created automatically)

You can modify these settings in `backend/.env` file if needed.

### 3. Start the Server

```powershell
cd backend
npm start
```

Or for development with auto-reload:

```powershell
npm run dev
```

The server will:
- Start on http://localhost:3000
- Automatically create the database and tables
- Create a default admin account

### 4. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## Default Login Credentials

### Admin Account
- **Email**: admin@lms.com
- **Password**: admin123

### Test User Account
You can register a new user account through the registration form.

## Project Structure

```
Leave Management System/
├── backend/
│   ├── index.js           # Main server file with API routes
│   ├── database.js        # Database configuration and initialization
│   ├── package.json       # Node.js dependencies
│   └── .env              # Environment variables
├── css/
│   └── style.css         # Custom styles
├── js/
│   ├── auth.js           # Login/Register functionality
│   ├── user-dashboard.js # User dashboard logic
│   └── admin-dashboard.js # Admin dashboard logic
├── index.html            # Login/Register page
├── user-dashboard.html   # User dashboard
├── admin-dashboard.html  # Admin dashboard
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User/Admin login
- `GET /api/session` - Check current session
- `POST /api/logout` - Logout

### User Routes (Authenticated)
- `GET /api/leaves` - Get user's leaves
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves/:id` - Get specific leave
- `PUT /api/leaves/:id` - Update leave (pending only)
- `DELETE /api/leaves/:id` - Cancel leave (pending only)

### Admin Routes (Admin Only)
- `GET /api/admin/leaves` - Get all leaves (with filters)
- `PUT /api/admin/leaves/:id` - Approve/Reject leave
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get dashboard statistics

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ Session-based authentication
- ✅ Role-based access control (Admin/User)
- ✅ Input validation on both client and server
- ✅ SQL injection prevention using parameterized queries
- ✅ CORS protection
- ✅ Secure session configuration

## Validation Rules

### Registration
- All fields required
- Password minimum 6 characters
- Valid email format

### Leave Application
- All fields required
- Reason minimum 10 characters
- End date must be after or equal to start date

### Login
- Email and password required
- Credentials must match database records

## User Roles and Permissions

### Admin
- Can view all leave applications
- Can approve or reject any leave
- Can add remarks to leave decisions
- Can view all users
- Can access admin dashboard
- Can filter and search leaves

### User
- Can apply for leave
- Can view own leave history
- Can edit pending leaves
- Can cancel pending leaves
- Cannot modify approved/rejected leaves
- Can view personal statistics

## Leave Types

- Sick Leave
- Casual Leave
- Annual Leave
- Emergency Leave
- Maternity Leave
- Paternity Leave

## Leave Status

- **Pending**: Newly submitted, awaiting admin review
- **Approved**: Approved by admin
- **Rejected**: Rejected by admin

## Troubleshooting

### Database Connection Issues
1. Ensure MySQL server is running
2. Verify credentials in `.env` file
3. Check if port 3306 is not blocked

### Server Won't Start
1. Ensure port 3000 is not in use
2. Run `npm install` to install dependencies
3. Check console for error messages

### Login Issues
1. Use default admin credentials: admin@lms.com / admin123
2. For users, register a new account first
3. Clear browser cache and cookies

## Development

To run in development mode with auto-reload:

```powershell
cd backend
npm run dev
```

This uses nodemon to automatically restart the server when files change.

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari

## Future Enhancements

- Email notifications for leave status changes
- Multiple leave types with quota management
- Calendar view for leaves
- Export leave reports
- Mobile app version
- Dashboard analytics and charts
- Multi-level approval workflow

## Support

For issues or questions, please check the code comments or modify the configuration as needed.

## License

This project is created for educational purposes.

---

**Note**: Change the `SESSION_SECRET` in the `.env` file before deploying to production.
