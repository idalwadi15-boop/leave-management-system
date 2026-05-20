// API Base URL
const API_URL = 'http://localhost:3001/api';

let currentAdmin = null;
let allLeaves = [];
let filteredLeaves = [];

// Show alert message
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fade-in`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alertDiv);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Check authentication and load admin data
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/session`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();
        if (!data.success || data.user.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        currentAdmin = data.user;
        document.getElementById('adminName').textContent = currentAdmin.name;
        document.getElementById('navAdminName').textContent = currentAdmin.name;

        // Load dashboard data
        await loadDashboard();
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
    }
}

// Load dashboard statistics and leaves
async function loadDashboard() {
    await Promise.all([loadStats(), loadLeaves()]);
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('totalLeaves').textContent = data.stats.totalLeaves;
            document.getElementById('pendingLeaves').textContent = data.stats.pendingLeaves;
            document.getElementById('approvedLeaves').textContent = data.stats.approvedLeaves;
            document.getElementById('rejectedLeaves').textContent = data.stats.rejectedLeaves;
        }
    } catch (error) {
        console.error('Load stats error:', error);
        showAlert('Failed to load statistics', 'danger');
    }
}

// Load all leaves
async function loadLeaves() {
    try {
        const response = await fetch(`${API_URL}/admin/leaves`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            allLeaves = data.leaves;
            filteredLeaves = allLeaves;
            displayLeaves(filteredLeaves);
        }
    } catch (error) {
        console.error('Load leaves error:', error);
        showAlert('Failed to load leaves', 'danger');
    }
}

// Display leaves in table
function displayLeaves(leaves) {
    const tbody = document.getElementById('leavesTableBody');

    if (leaves.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-2 d-block"></i>
                    No leave applications found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = leaves.map(leave => {
        const startDate = new Date(leave.start_date).toLocaleDateString();
        const endDate = new Date(leave.end_date).toLocaleDateString();
        const appliedDate = new Date(leave.created_at).toLocaleDateString();
        const statusBadge = getStatusBadge(leave.status);
        const isPending = leave.status === 'pending';

        return `
            <tr>
                <td><strong>#${leave.id}</strong></td>
                <td>
                    <div><strong>${leave.user_name}</strong></div>
                    <small class="text-muted">${leave.user_email}</small>
                </td>
                <td>${leave.leave_type}</td>
                <td>
                    <small>
                        <i class="fas fa-calendar-alt me-1"></i>${startDate}<br>
                        <i class="fas fa-calendar-check me-1"></i>${endDate}
                    </small>
                </td>
                <td><small>${appliedDate}</small></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewLeave(${leave.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isPending ? `
                        <button class="btn btn-sm btn-success" onclick="showActionModal(${leave.id}, 'approved')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="showActionModal(${leave.id}, 'rejected')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge badge-pending"><i class="fas fa-clock me-1"></i>Pending</span>',
        approved: '<span class="badge badge-approved"><i class="fas fa-check-circle me-1"></i>Approved</span>',
        rejected: '<span class="badge badge-rejected"><i class="fas fa-times-circle me-1"></i>Rejected</span>'
    };
    return badges[status] || status;
}

// View leave details
function viewLeave(leaveId) {
    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;

    const startDate = new Date(leave.start_date).toLocaleDateString();
    const endDate = new Date(leave.end_date).toLocaleDateString();
    const createdAt = new Date(leave.created_at).toLocaleString();
    const updatedAt = new Date(leave.updated_at).toLocaleString();

    const content = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <strong><i class="fas fa-user me-2"></i>User Name:</strong>
                <p>${leave.user_name}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong><i class="fas fa-envelope me-2"></i>User Email:</strong>
                <p>${leave.user_email}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong><i class="fas fa-tag me-2"></i>Leave Type:</strong>
                <p>${leave.leave_type}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong><i class="fas fa-info-circle me-2"></i>Status:</strong>
                <p>${getStatusBadge(leave.status)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong><i class="fas fa-calendar-alt me-2"></i>Start Date:</strong>
                <p>${startDate}</p>
            </div>
            <div class="col-md-6 mb-3">
                <strong><i class="fas fa-calendar-check me-2"></i>End Date:</strong>
                <p>${endDate}</p>
            </div>
            <div class="col-12 mb-3">
                <strong><i class="fas fa-comment me-2"></i>Reason:</strong>
                <p class="border rounded p-3 bg-light">${leave.reason}</p>
            </div>
            ${leave.admin_remarks ? `
                <div class="col-12 mb-3">
                    <strong><i class="fas fa-user-shield me-2"></i>Admin Remarks:</strong>
                    <p class="border rounded p-3 bg-light">${leave.admin_remarks}</p>
                </div>
            ` : ''}
            <div class="col-md-6">
                <small class="text-muted"><i class="fas fa-clock me-1"></i>Applied: ${createdAt}</small>
            </div>
            <div class="col-md-6">
                <small class="text-muted"><i class="fas fa-clock me-1"></i>Updated: ${updatedAt}</small>
            </div>
        </div>
    `;

    document.getElementById('viewLeaveContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewLeaveModal')).show();
}

// Show action modal (Approve/Reject)
function showActionModal(leaveId, action) {
    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;

    document.getElementById('actionLeaveId').value = leaveId;
    document.getElementById('actionType').value = action;
    document.getElementById('adminRemarks').value = '';

    const modalTitle = document.getElementById('actionModalTitle');
    const actionMessage = document.getElementById('actionMessage');
    const confirmBtn = document.getElementById('confirmActionBtn');

    if (action === 'approved') {
        modalTitle.innerHTML = '<i class="fas fa-check-circle me-2 text-success"></i>Approve Leave Application';
        actionMessage.innerHTML = `You are about to <strong class="text-success">APPROVE</strong> the leave application from <strong>${leave.user_name}</strong>.`;
        confirmBtn.className = 'btn btn-success';
        confirmBtn.innerHTML = '<i class="fas fa-check me-2"></i>Approve';
    } else {
        modalTitle.innerHTML = '<i class="fas fa-times-circle me-2 text-danger"></i>Reject Leave Application';
        actionMessage.innerHTML = `You are about to <strong class="text-danger">REJECT</strong> the leave application from <strong>${leave.user_name}</strong>.`;
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.innerHTML = '<i class="fas fa-times me-2"></i>Reject';
    }

    new bootstrap.Modal(document.getElementById('actionModal')).show();
}

// Confirm action (Approve/Reject)
document.getElementById('confirmActionBtn').addEventListener('click', async () => {
    const leaveId = document.getElementById('actionLeaveId').value;
    const action = document.getElementById('actionType').value;
    const remarks = document.getElementById('adminRemarks').value.trim();

    try {
        const response = await fetch(`${API_URL}/admin/leaves/${leaveId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                status: action,
                admin_remarks: remarks
            })
        });

        const data = await response.json();
        if (data.success) {
            showAlert(`Leave application ${action} successfully!`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('actionModal')).hide();
            await loadDashboard();
        } else {
            showAlert(data.message || `Failed to ${action} leave`, 'danger');
        }
    } catch (error) {
        console.error('Action error:', error);
        showAlert(`An error occurred while ${action === 'approved' ? 'approving' : 'rejecting'} leave`, 'danger');
    }
});

// Filter leaves by status
document.getElementById('filterStatus').addEventListener('change', (e) => {
    applyFilters();
});

// Search users
document.getElementById('searchUser').addEventListener('input', (e) => {
    applyFilters();
});

// Apply all filters
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const searchText = document.getElementById('searchUser').value.toLowerCase();

    filteredLeaves = allLeaves.filter(leave => {
        const matchesStatus = !statusFilter || leave.status === statusFilter;
        const matchesSearch = !searchText || 
            leave.user_name.toLowerCase().includes(searchText) ||
            leave.user_email.toLowerCase().includes(searchText);
        
        return matchesStatus && matchesSearch;
    });

    displayLeaves(filteredLeaves);
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', loadDashboard);

// Logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
});

// Initialize
checkAuth();
