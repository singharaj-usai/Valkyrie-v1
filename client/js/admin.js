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
            loadUserManagement();
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
                postsList.append(`
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                        </div>
                        <div class="panel-body">
                            <p>${escapeHtml(post.content.substring(0, 200))}...</p>
                            <p><small>Posted by ${escapeHtml(post.author.username)} on ${new Date(post.createdAt).toLocaleString()}</small></p>
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
        error: function() {
            contentArea.html('<p class="text-danger">Error loading forum posts.</p>');
        }
    });
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
    contentArea.html('<h2>Users</h2><div id="users-list"></div>');

    $.ajax({
        url: '/api/admin/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(users) {
            const usersList = $('#users-list');
            users.forEach(user => {
                usersList.append(`
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">${escapeHtml(user.username)}</h3>
                        </div>
                        <div class="panel-body">
                            <p>Email: ${escapeHtml(user.email)}</p>
                            <p>Joined: ${new Date(user.createdAt).toLocaleString()}</p>
                            <button class="btn btn-warning btn-sm toggle-ban" data-user-id="${user._id}" data-is-banned="${user.isBanned}">
                                ${user.isBanned ? 'Unban' : 'Ban'} User
                            </button>
                        </div>
                         <div class="panel-footer">
                        <button class="btn btn-warning btn-sm toggle-ban" data-user-id="${user._id}" data-is-banned="${user.isBanned}">
                            ${user.isBanned ? 'Unban' : 'Ban'} User
                        </button>
                        ${user.isAdmin ? '<span class="label label-success">Admin</span>' : 
                            `<button class="btn btn-info btn-sm promote-admin" data-user-id="${user._id}">Promote to Admin</button>`}
                        </div>
                    </div>
                `);
            });

            $('.toggle-ban').on('click', function() {
                const userId = $(this).data('user-id');
                const isBanned = $(this).data('is-banned');
                toggleUserBan(userId, !isBanned);
            });

            $('.promote-admin').on('click', function() {
                const userId = $(this).data('user-id');
                promoteToAdmin(userId);
            });
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading users.</p>');
        }
    });
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

function loadUserManagement() {
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
            users.forEach(user => {
                userList.append(`
                    <tr>
                        <td>${escapeHtml(user.username)}</td>
                        <td>${escapeHtml(user.email)}</td>
                        <td>${new Date(user.signupDate).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-sm btn-${user.isBanned ? 'success' : 'warning'} toggle-ban" data-user-id="${user._id}" data-is-banned="${user.isBanned}">
                                ${user.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button class="btn btn-sm btn-danger delete-user" data-user-id="${user._id}">Delete</button>
                        </td>
                    </tr>
                `);
            });

            $('.toggle-ban').on('click', function() {
                const userId = $(this).data('user-id');
                const isBanned = $(this).data('is-banned');
                toggleUserBan(userId, !isBanned);
            });

            $('.delete-user').on('click', function() {
                const userId = $(this).data('user-id');
                deleteUser(userId);
            });
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading users.</p>');
        }
    });
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
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}