// API Base URL
const API_URL = 'http://localhost:3001/api';

// Show alert message
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alertDiv);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Check if user is already logged in (only on login page)
async function checkSession() {
    // Only check session on login page, silently handle errors
    try {
        const response = await fetch(`${API_URL}/session`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Redirect to appropriate dashboard
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            }
        }
        // If not logged in (401), do nothing - this is expected on login page
    } catch (error) {
        // Silently handle errors - user is just not logged in
        console.log('Not logged in yet');
    }
}

// Check session on page load
checkSession();

// Toggle between login and register forms
document.getElementById('showRegisterForm').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('showRegisterForm').parentElement.style.display = 'none';
    document.getElementById('backToLoginContainer').style.display = 'block';
    document.getElementById('alertContainer').innerHTML = '';
});

document.getElementById('showLoginForm').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('showRegisterForm').parentElement.style.display = 'block';
    document.getElementById('backToLoginContainer').style.display = 'none';
    document.getElementById('alertContainer').innerHTML = '';
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const data = await response.json();
            showAlert(data.message || 'Login failed', 'danger');
            return;
        }

        const data = await response.json();

        if (data.success) {
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            }, 1000);
        } else {
            showAlert(data.message || 'Login failed', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Connection error. Please check if the server is running.', 'danger');
    }
});

// Register Form Handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    // Validation
    if (!name || !email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'danger');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert(data.message || 'Registration successful! Please login.', 'success');
            
            // Clear form and switch to login
            document.getElementById('registerForm').reset();
            setTimeout(() => {
                document.getElementById('showLoginForm').click();
            }, 2000);
        } else {
            showAlert(data.message || 'Registration failed', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Connection error. Please check if the server is running.', 'danger');
    }
});
