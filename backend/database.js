const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Initialize database and tables
async function initializeDatabase() {
    try {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306
        });

        const promiseConnection = connection.promise();

        // Create database if not exists
        await promiseConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log('Database created or already exists');

        await promiseConnection.query(`USE ${process.env.DB_NAME}`);

        // Create users table
        await promiseConnection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table created or already exists');

        // Create leaves table
        await promiseConnection.query(`
            CREATE TABLE IF NOT EXISTS leaves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                leave_type VARCHAR(50) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Leaves table created or already exists');

        // Check if admin exists, if not create default admin
        const [rows] = await promiseConnection.query(
            'SELECT * FROM users WHERE role = "admin" LIMIT 1'
        );

        if (rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await promiseConnection.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@lms.com', hashedPassword, 'admin']
            );
            console.log('Default admin created: admin@lms.com / admin123');
        }

        await promiseConnection.end();
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = { pool: promisePool, initializeDatabase };
