function loadUsers() {
    const contentArea = $('#content-area');
    contentArea.html('<h2 class="text-primary">User Management</h2><div id="user-management"></div>');

    $.ajax({
        url: '/api/admin/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(users) {
            displayUsers(users);
        },
        error: function() {
            contentArea.html('<div class="alert alert-danger" role="alert">Error loading users.</div>');
        }
    });
}

function displayUsers(users) {
    const userManagement = $('#user-management');
    userManagement.empty();

    const currentAdminId = localStorage.getItem('userId');
    users.forEach(user => {
        const panel = $(`
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(user.username)}</h3>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
                            <p><strong>Signup Date:</strong> ${new Date(user.signupDate).toLocaleString()}</p>
                            <p><strong>Status:</strong> 
                                <span class="label label-${user.isBanned ? 'danger' : 'success'}">
                                    ${user.isBanned ? 'Banned' : 'Active'}
                                </span>
                            </p>
                            <p><strong>Role:</strong> 
                                <span class="label label-${user.isAdmin ? 'primary' : 'default'}">
                                    ${user.isAdmin ? 'Admin' : 'User'}
                                </span>
                            </p>
                        </div>
                        <div class="col-md-6">
                            <div class="btn-group-vertical btn-block" role="group">
                                <button class="btn btn-${user.isBanned ? 'success' : 'warning'} ban-user" data-user-id="${user._id}" data-is-banned="${user.isBanned}">
                                    ${user.isBanned ? 'Unban User' : 'Ban User'}
                                </button>
                                ${user.isAdmin ? 
                                    (user._id !== currentAdminId ? 
                                        `<button class="btn btn-danger demote-admin" data-user-id="${user._id}">Demote from Admin</button>` : 
                                        '<button class="btn btn-success" disabled>Current Admin</button>'
                                    ) : 
                                    `<button class="btn btn-info promote-admin" data-user-id="${user._id}">Promote to Admin</button>`
                                }
                                <button class="btn btn-danger delete-user" data-user-id="${user._id}">Delete User</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        userManagement.append(panel);
    });

    addUserEventListeners();
}

function addUserEventListeners() {
    $('.ban-user').on('click', function() {
        const userId = $(this).data('user-id');
        const isBanned = $(this).data('is-banned');
        if (isBanned) {
            unbanUser(userId);
        } else {
            showBanModal(userId);
        }
    });

    $('.promote-admin').on('click', function() {
        const userId = $(this).data('user-id');
        promoteToAdmin(userId);
    });

    $('.demote-admin').on('click', function() {
        const userId = $(this).data('user-id');
        demoteAdmin(userId);
    });

    $('.delete-user').on('click', function() {
        const userId = $(this).data('user-id');
        deleteUser(userId);
    });
}

function showBanModal(userId) {
    const modal = `
    <div class="modal fade" id="banUserModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Ban User</h4>
                </div>
                <div class="modal-body">
                    <form id="banUserForm">
                        <div class="form-group">
                            <label for="banReason">Reason for ban:</label>
                            <textarea class="form-control" id="banReason" rows="3" required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmBan">Ban User</button>
                </div>
            </div>
        </div>
    </div>
    `;

    $('body').append(modal);
    $('#banUserModal').modal('show');

    $('#confirmBan').on('click', function() {
        const banReason = $('#banReason').val();
        if (banReason) {
            banUser(userId, banReason);
            $('#banUserModal').modal('hide');
        } else {
            alert('Please provide a reason for the ban.');
        }
    });

    $('#banUserModal').on('hidden.bs.modal', function() {
        $(this).remove();
    });
}

function banUser(userId, banReason) {
    $.ajax({
        url: `/api/admin/users/${userId}/ban`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        data: JSON.stringify({ ban: true, banReason }),
        contentType: 'application/json',
        success: function() {
            showAlert('success', 'User banned successfully.');
            loadUsers();
        },
        error: function() {
            showAlert('danger', 'Error banning user. Please try again.');
        }
    });
}

function unbanUser(userId) {
    if (confirm('Are you sure you want to unban this user?')) {
        $.ajax({
            url: `/api/admin/users/${userId}/ban`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            data: JSON.stringify({ ban: false }),
            contentType: 'application/json',
            success: function() {
                showAlert('success', 'User unbanned successfully.');
                loadUsers();
            },
            error: function() {
                showAlert('danger', 'Error unbanning user. Please try again.');
            }
        });
    }
}

function promoteToAdmin(userId) {
    if (confirm('Are you sure you want to promote this user to admin?')) {
      $.ajax({
        url: `/api/admin/promote-admin/${userId}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function() {
          showAlert('success', 'User promoted to admin successfully.');
          loadUsers();
        },
        error: function(xhr) {
          showAlert('danger', `Error promoting user to admin: ${xhr.responseJSON.error}`);
        }
      });
    }
}

function demoteAdmin(userId) {
    if (confirm('Are you sure you want to demote this user from admin?')) {
        $.ajax({
            url: `/api/admin/demote-admin/${userId}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function() {
                showAlert('success', 'User demoted from admin successfully.');
                loadUsers();
            },
            error: function(xhr) {
                showAlert('danger', `Error demoting user from admin: ${xhr.responseJSON.error}`);
            }
        });
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        $.ajax({
            url: `/api/admin/users/${userId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function() {
                showAlert('success', 'User deleted successfully.');
                loadUsers();
            },
            error: function() {
                showAlert('danger', 'Error deleting user. Please try again.');
            }
        });
    }
}

function showAlert(type, message) {
    const alertDiv = $(`<div class="alert alert-${type} alert-dismissible" role="alert">
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            ${message}
                        </div>`);
    $('#user-management').prepend(alertDiv);
    setTimeout(() => alertDiv.alert('close'), 5000);
}