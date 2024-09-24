$(document).ready(function() {
    // Check if the user is authenticated and has admin privileges
    checkAdminAuth();

    // Handle sidebar navigation
    $('.nav-sidebar a').on('click', function(e) {
        e.preventDefault();
        $('.nav-sidebar li').removeClass('active');
        $(this).parent().addClass('active');
        loadSection($(this).data('section'));
    });

    // Handle logout
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        logout();
    });
});

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

function loadSection(section) {
    const contentArea = $('#content-area');
    contentArea.empty();

    switch (section) {
        case 'overview':
            loadOverview();
            break;
        case 'forum-posts':
            loadForumPosts();
            break;
        case 'users':
            loadUsers();
            break;
        case 'games':
            loadGames();
            break;
        case 'statistics':
            loadStatistics();
            break;
    }
}

function loadOverview() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Overview</h2><p>Welcome to the admin dashboard. Select a section from the sidebar to manage different aspects of the website.</p>');
}

function loadForumPosts() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Forum Posts</h2><div id="forum-posts-list"></div>');

    $.ajax({
        url: '/api/admin/forum-posts',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(posts) {
            const postsList = $('#forum-posts-list');
            posts.forEach(post => {
                const sectionName = getSectionName(post.section);
                postsList.append(`
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                        </div>
                        <div class="panel-body">
                            <p>${escapeHtml(post.content ? post.content.substring(0, 200) : '')}...</p>
                            <p><small>Posted by ${escapeHtml(post.author ? post.author.username : 'Unknown')} on ${post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Unknown date'}</small></p>
                            <p><strong>Section:</strong> ${escapeHtml(sectionName)}</p>
                            <button class="btn btn-danger btn-sm delete-post" data-post-id="${post._id}">Delete Post</button>
                        </div>
                    </div>
                `);
            });

            $('.delete-post').on('click', function() {
                const postId = $(this).data('post-id');
                deleteForumPost(postId);
            });
        },
        error: function(xhr, status, error) {
            console.error('Error loading forum posts:', error);
            contentArea.html(`<p class="text-danger">Error loading forum posts: ${error}</p>`);
        }
    });
}

function getSectionName(sectionId) {
    const sectionMap = {
        'announcements': 'Announcements',
        'general': 'General Discussion',
        'game-dev': 'Game Development',
        'support': 'Support',
        'off-topic': 'Off-Topic'
    };
    return sectionMap[sectionId] || 'Unknown Section';
}

function deleteForumPost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        $.ajax({
            url: `/api/admin/forum-posts/${postId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function() {
                alert('Post deleted successfully.');
                loadForumPosts();
            },
            error: function() {
                alert('Error deleting post. Please try again.');
            }
        });
    }
}

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
                        <td>${new Date(user.createdAt).toLocaleString()}</td>
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

      
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading users.</p>');
        }
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

function toggleUserBan(userId, ban) {
    $.ajax({
        url: `/api/admin/users/${userId}/ban`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        data: JSON.stringify({ ban }),
        contentType: 'application/json',
        success: function() {
            alert(`User ${ban ? 'banned' : 'unbanned'} successfully.`);
            loadUsers();
        },
        error: function() {
            alert('Error updating user ban status. Please try again.');
        }
    });
}

function loadGames() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Games</h2><div id="games-list"></div>');

    $.ajax({
        url: '/api/admin/games',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(games) {
            const gamesList = $('#games-list');
            games.forEach(game => {
                gamesList.append(`
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">${escapeHtml(game.title)}</h3>
                        </div>
                        <div class="panel-body">
                            <p>Creator: ${escapeHtml(game.creator.username)}</p>
                            <p>Created: ${new Date(game.createdAt).toLocaleString()}</p>
                            <button class="btn btn-danger btn-sm delete-game" data-game-id="${game._id}">Delete Game</button>
                        </div>
                    </div>
                `);
            });

            $('.delete-game').on('click', function() {
                const gameId = $(this).data('game-id');
                deleteGame(gameId);
            });
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading games.</p>');
        }
    });
}

function deleteGame(gameId) {
    if (confirm('Are you sure you want to delete this game?')) {
        $.ajax({
            url: `/api/admin/games/${gameId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function() {
                alert('Game deleted successfully.');
                loadGames();
            },
            error: function() {
                alert('Error deleting game. Please try again.');
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

function loadStatistics() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Statistics</h2><div id="statistics"></div>');

    $.ajax({
        url: '/api/admin/statistics',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(stats) {
            const statistics = $('#statistics');
            statistics.html(`
                <div class="row">
                    <div class="col-md-3">
                        <div class="panel panel-primary">
                            <div class="panel-heading">Total Users</div>
                            <div class="panel-body">
                                <h3>${stats.totalUsers}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="panel panel-success">
                            <div class="panel-heading">Total Games</div>
                            <div class="panel-body">
                                <h3>${stats.totalGames}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="panel panel-info">
                            <div class="panel-heading">Total Forum Posts</div>
                            <div class="panel-body">
                                <h3>${stats.totalForumPosts}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="panel panel-warning">
                            <div class="panel-heading">Active Users (Last 24h)</div>
                            <div class="panel-body">
                                <h3>${stats.activeUsers}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading statistics.</p>');
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}