function loadUsers() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>User Management</h2><div id="user-management"></div>');

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
            contentArea.html('<p class="text-danger">Error loading users.</p>');
        }
    });
}

function displayUsers(users) {
    const userManagement = $('#user-management');
    userManagement.html(`
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Signup Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="user-list"></tbody>
        </table>
    `);

    const userList = $('#user-list');
    const currentAdminId = localStorage.getItem('userId');
    users.forEach(user => {
        userList.append(`
            <tr>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${new Date(user.signupDate).toLocaleString()}</td>
                <td>
                   <button class="btn btn-sm btn-${user.isBanned ? 'success' : 'warning'} ban-user" data-user-id="${user._id}" data-is-banned="${user.isBanned}">
                        ${user.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    ${user.isAdmin ? 
                        (user._id !== currentAdminId ? 
                            `<button class="btn btn-sm btn-danger demote-admin" data-user-id="${user._id}">Demote Admin</button>` : 
                            '<span class="label label-success">Current Admin</span>'
                        ) : 
                        `<button class="btn btn-sm btn-info promote-admin" data-user-id="${user._id}">Promote to Admin</button>`
                    }
                </td>
            </tr>
        `);
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
}

function showBanModal(userId) {
    const modal = `
    <div class="modal fade" id="banUserModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Ban User</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="banUserForm">
                        <div class="form-group">
                            <label for="banReason">Reason for ban:</label>
                            <textarea class="form-control" id="banReason" required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
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
            alert('User banned successfully.');
            loadUsers();
        },
        error: function() {
            alert('Error banning user. Please try again.');
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
                alert('User unbanned successfully.');
                loadUsers();
            },
            error: function() {
                alert('Error unbanning user. Please try again.');
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
          alert('User promoted to admin successfully.');
          loadUsers();
        },
        error: function(xhr) {
          alert(`Error promoting user to admin: ${xhr.responseJSON.error}`);
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
                alert('User demoted from admin successfully.');
                loadUsers();
            },
            error: function(xhr) {
                alert(`Error demoting user from admin: ${xhr.responseJSON.error}`);
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
                alert('User deleted successfully.');
                loadUserManagement();
            },
            error: function() {
                alert('Error deleting user. Please try again.');
            }
        });
    }
}