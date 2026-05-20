const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS must be configured properly for credentials
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or file://)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
};

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'user']
        );

        res.json({ success: true, message: 'Registration successful! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Set session - Make sure to save it explicitly
        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.role = user.role;

        // Save session before sending response
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Session error' });
            }

            console.log('Session created:', req.session);
            console.log('Session ID:', req.sessionID);

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Get current user session
app.get('/api/session', (req, res) => {
    console.log('Session check - SessionID:', req.sessionID);
    console.log('Session data:', req.session);
    
    if (req.session.userId) {
        res.json({
            success: true,
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.role
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// ==================== LEAVE ROUTES ====================

// Apply for leave
app.post('/api/leaves', isAuthenticated, async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason } = req.body;
        const user_id = req.session.userId;

        // Validation
        if (!leave_type || !start_date || !end_date || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (reason.length < 10) {
            return res.status(400).json({ success: false, message: 'Reason must be at least 10 characters' });
        }

        // Date validation
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (startDate > endDate) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        // Insert leave
        const [result] = await pool.query(
            'INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, leave_type, start_date, end_date, reason, 'pending']
        );

        res.json({ success: true, message: 'Leave application submitted successfully', leaveId: result.insertId });
    } catch (error) {
        console.error('Leave application error:', error);
        res.status(500).json({ success: false, message: 'Server error while applying for leave' });
    }
});

// Get user's leaves
app.get('/api/leaves', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.session.userId;
        const [leaves] = await pool.query(
            'SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );

        res.json({ success: true, leaves });
    } catch (error) {
        console.error('Fetch leaves error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching leaves' });
    }
});

// Get specific leave by ID
app.get('/api/leaves/:id', isAuthenticated, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const user_id = req.session.userId;

        const [leaves] = await pool.query(
            'SELECT * FROM leaves WHERE id = ? AND user_id = ?',
            [leaveId, user_id]
        );

        if (leaves.length === 0) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        res.json({ success: true, leave: leaves[0] });
    } catch (error) {
        console.error('Fetch leave error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching leave' });
    }
});

// Update/Cancel leave (only if pending)
app.put('/api/leaves/:id', isAuthenticated, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const user_id = req.session.userId;
        const { leave_type, start_date, end_date, reason } = req.body;

        // Check if leave exists and belongs to user
        const [leaves] = await pool.query(
            'SELECT * FROM leaves WHERE id = ? AND user_id = ?',
            [leaveId, user_id]
        );

        if (leaves.length === 0) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        if (leaves[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Cannot edit leave that has been processed' });
        }

        // Validation
        if (reason && reason.length < 10) {
            return res.status(400).json({ success: false, message: 'Reason must be at least 10 characters' });
        }

        // Date validation
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            if (startDate > endDate) {
                return res.status(400).json({ success: false, message: 'End date must be after start date' });
            }
        }

        // Update leave
        await pool.query(
            'UPDATE leaves SET leave_type = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ?',
            [leave_type, start_date, end_date, reason, leaveId]
        );

        res.json({ success: true, message: 'Leave updated successfully' });
    } catch (error) {
        console.error('Update leave error:', error);
        res.status(500).json({ success: false, message: 'Server error while updating leave' });
    }
});

// Delete/Cancel leave (only if pending)
app.delete('/api/leaves/:id', isAuthenticated, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const user_id = req.session.userId;

        // Check if leave exists and belongs to user
        const [leaves] = await pool.query(
            'SELECT * FROM leaves WHERE id = ? AND user_id = ?',
            [leaveId, user_id]
        );

        if (leaves.length === 0) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        if (leaves[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Cannot cancel leave that has been processed' });
        }

        // Delete leave
        await pool.query('DELETE FROM leaves WHERE id = ?', [leaveId]);

        res.json({ success: true, message: 'Leave cancelled successfully' });
    } catch (error) {
        console.error('Delete leave error:', error);
        res.status(500).json({ success: false, message: 'Server error while cancelling leave' });
    }
});

// ==================== ADMIN ROUTES ====================

// Get all leaves (Admin only)
app.get('/api/admin/leaves', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { status, user_id } = req.query;
        let query = `
            SELECT leaves.*, users.name as user_name, users.email as user_email 
            FROM leaves 
            JOIN users ON leaves.user_id = users.id
        `;
        const params = [];

        // Add filters
        const conditions = [];
        if (status) {
            conditions.push('leaves.status = ?');
            params.push(status);
        }
        if (user_id) {
            conditions.push('leaves.user_id = ?');
            params.push(user_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY leaves.created_at DESC';

        const [leaves] = await pool.query(query, params);

        res.json({ success: true, leaves });
    } catch (error) {
        console.error('Admin fetch leaves error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching leaves' });
    }
});

// Approve/Reject leave (Admin only)
app.put('/api/admin/leaves/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const { status, admin_remarks } = req.body;

        // Validation
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Check if leave exists
        const [leaves] = await pool.query('SELECT * FROM leaves WHERE id = ?', [leaveId]);
        if (leaves.length === 0) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        // Update leave status
        await pool.query(
            'UPDATE leaves SET status = ?, admin_remarks = ? WHERE id = ?',
            [status, admin_remarks || null, leaveId]
        );

        res.json({ success: true, message: `Leave ${status} successfully` });
    } catch (error) {
        console.error('Admin update leave error:', error);
        res.status(500).json({ success: false, message: 'Server error while updating leave' });
    }
});

// Get all users (Admin only)
app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({ success: true, users });
    } catch (error) {
        console.error('Admin fetch users error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching users' });
    }
});

// Get dashboard statistics (Admin only)
app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const [totalLeaves] = await pool.query('SELECT COUNT(*) as count FROM leaves');
        const [pendingLeaves] = await pool.query('SELECT COUNT(*) as count FROM leaves WHERE status = "pending"');
        const [approvedLeaves] = await pool.query('SELECT COUNT(*) as count FROM leaves WHERE status = "approved"');
        const [rejectedLeaves] = await pool.query('SELECT COUNT(*) as count FROM leaves WHERE status = "rejected"');

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers[0].count,
                totalLeaves: totalLeaves[0].count,
                pendingLeaves: pendingLeaves[0].count,
                approvedLeaves: approvedLeaves[0].count,
                rejectedLeaves: rejectedLeaves[0].count
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching statistics' });
    }
});

// ==================== START SERVER ====================

// Initialize database and start server
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Database: ${process.env.DB_NAME}`);
            console.log(`👤 Default Admin: admin@lms.com / admin123\n`);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
