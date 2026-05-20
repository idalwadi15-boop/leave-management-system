// API Base URL
const API_URL = 'http://localhost:3001/api';

let currentUser = null;
let allLeaves = [];

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

// Check authentication and load user data
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
        if (!data.success || data.user.role !== 'user') {
            window.location.href = 'index.html';
            return;
        }

        currentUser = data.user;
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('navUserName').textContent = currentUser.name;

        // Load leaves
        await loadLeaves();
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
    }
}

// Load user's leaves
async function loadLeaves() {
    try {
        const response = await fetch(`${API_URL}/leaves`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            allLeaves = data.leaves;
            updateStats();
            displayLeaves(allLeaves);
        }
    } catch (error) {
        console.error('Load leaves error:', error);
        showAlert('Failed to load leaves', 'danger');
    }
}

// Update statistics
function updateStats() {
    const pending = allLeaves.filter(l => l.status === 'pending').length;
    const approved = allLeaves.filter(l => l.status === 'approved').length;
    const rejected = allLeaves.filter(l => l.status === 'rejected').length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = allLeaves.length;
}

// Display leaves in table
function displayLeaves(leaves) {
    const tbody = document.getElementById('leavesTableBody');

    if (leaves.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-2 d-block"></i>
                    No leave records found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = leaves.map(leave => {
        const startDate = new Date(leave.start_date).toLocaleDateString();
        const endDate = new Date(leave.end_date).toLocaleDateString();
        const statusBadge = getStatusBadge(leave.status);
        const canEdit = leave.status === 'pending';

        return `
            <tr>
                <td><strong>${leave.leave_type}</strong></td>
                <td>
                    <small class="text-muted">
                        <i class="fas fa-calendar-alt me-1"></i>${startDate} to ${endDate}
                    </small>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewLeave(${leave.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${canEdit ? `
                        <button class="btn btn-sm btn-warning" onclick="editLeave(${leave.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLeave(${leave.id})">
                            <i class="fas fa-trash"></i> Cancel
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

    const content = `
        <div class="row">
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
                <p class="border rounded p-2 bg-light">${leave.reason}</p>
            </div>
            ${leave.admin_remarks ? `
                <div class="col-12 mb-3">
                    <strong><i class="fas fa-user-shield me-2"></i>Admin Remarks:</strong>
                    <p class="border rounded p-2 bg-light">${leave.admin_remarks}</p>
                </div>
            ` : ''}
            <div class="col-12">
                <small class="text-muted"><i class="fas fa-clock me-1"></i>Applied on: ${createdAt}</small>
            </div>
        </div>
    `;

    document.getElementById('viewLeaveContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('viewLeaveModal')).show();
}

// Edit leave
function editLeave(leaveId) {
    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;

    document.getElementById('editLeaveId').value = leave.id;
    document.getElementById('editLeaveType').value = leave.leave_type;
    document.getElementById('editStartDate').value = leave.start_date;
    document.getElementById('editEndDate').value = leave.end_date;
    document.getElementById('editReason').value = leave.reason;

    new bootstrap.Modal(document.getElementById('editLeaveModal')).show();
}

// Delete/Cancel leave
async function deleteLeave(leaveId) {
    if (!confirm('Are you sure you want to cancel this leave application?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/leaves/${leaveId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            showAlert('Leave application cancelled successfully', 'success');
            await loadLeaves();
        } else {
            showAlert(data.message || 'Failed to cancel leave', 'danger');
        }
    } catch (error) {
        console.error('Delete leave error:', error);
        showAlert('An error occurred while cancelling leave', 'danger');
    }
}

// Apply Leave Form Handler
document.getElementById('applyLeaveForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value.trim();

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }

    if (reason.length < 10) {
        showAlert('Reason must be at least 10 characters', 'danger');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showAlert('End date must be after start date', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/leaves`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason
            })
        });

        const data = await response.json();
        if (data.success) {
            showAlert('Leave application submitted successfully!', 'success');
            document.getElementById('applyLeaveForm').reset();
            document.getElementById('charCount').textContent = '0';
            await loadLeaves();
        } else {
            showAlert(data.message || 'Failed to submit leave application', 'danger');
        }
    } catch (error) {
        console.error('Apply leave error:', error);
        showAlert('An error occurred while applying for leave', 'danger');
    }
});

// Save Edit Leave Handler
document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const leaveId = document.getElementById('editLeaveId').value;
    const leaveType = document.getElementById('editLeaveType').value;
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    const reason = document.getElementById('editReason').value.trim();

    // Validation
    if (reason.length < 10) {
        showAlert('Reason must be at least 10 characters', 'danger');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showAlert('End date must be after start date', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/leaves/${leaveId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason
            })
        });

        const data = await response.json();
        if (data.success) {
            showAlert('Leave updated successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editLeaveModal')).hide();
            await loadLeaves();
        } else {
            showAlert(data.message || 'Failed to update leave', 'danger');
        }
    } catch (error) {
        console.error('Update leave error:', error);
        showAlert('An error occurred while updating leave', 'danger');
    }
});

// Filter leaves by status
document.getElementById('filterStatus').addEventListener('change', (e) => {
    const status = e.target.value;
    if (status) {
        const filtered = allLeaves.filter(l => l.status === status);
        displayLeaves(filtered);
    } else {
        displayLeaves(allLeaves);
    }
});

// Character count for reason field
document.getElementById('reason').addEventListener('input', (e) => {
    const count = e.target.value.length;
    document.getElementById('charCount').textContent = count;
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', loadLeaves);

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

// Set minimum date for date inputs to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('startDate').setAttribute('min', today);
document.getElementById('endDate').setAttribute('min', today);

// Initialize
checkAuth();
