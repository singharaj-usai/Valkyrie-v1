function checkAdminAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect=/admin/dashboard';
        return;
    }

    $.ajax({
        url: '/api/admin/check-auth',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            if (response.isAdmin) {
                loadDashboard();
            } else {
                alert('You do not have admin privileges.');
                window.location.href = '/';
            }
        },
        error: function() {
            alert('Authentication failed. Please log in again.');
            logout();
        }
    });
}

function loadDashboard() {
    // Load the dashboard content here
    loadSection('overview');
}

function checkUserBan() {
    $.ajax({
        url: '/api/users/check-ban',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(response) {
            if (response.isBanned) {
                window.location.href = '/banned';
            }
        },
        error: function(xhr) {
            if (xhr.status === 403) {
                window.location.href = '/banned';
            }
        }
    });
}