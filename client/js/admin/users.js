let currentSearch = '';
let currentSortBy = 'username';
let currentSortOrder = 'asc';

// Update the loadUsers function
function loadUsers() {
  const currentUserId = localStorage.getItem('userId');
  const contentArea = $('#content-area');
  contentArea.html(`
    <h2 class="text-primary">User Management</h2>
    <div class="row mb-3">
      <div class="col-md-6">
        <div class="input-group">
          <input type="text" id="user-search" class="form-control" placeholder="Search users...">
          <span class="input-group-btn">
            <button class="btn btn-primary" type="button" id="search-btn">
              <i class="fa fa-search"></i> Search
            </button>
          </span>
        </div>
      </div>
      <div class="col-md-6">
        <div class="input-group">
          <select id="sort-by" class="form-control">
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="signupDate">Signup Date</option>
            <option value="currency">Currency</option>
          </select>
          <span class="input-group-btn">
            <button class="btn btn-default" type="button" id="sort-order-btn">
              <i class="fa fa-sort-alpha-asc"></i> Sort
            </button>
          </span>
        </div>
      </div>
    </div>
    <div id="user-management" class="row"></div>
  `);

  // Add event listeners for search and sort
  $('#search-btn').on('click', performSearch);
  $('#user-search').on('keyup', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  $('#sort-by').on('change', performSort);
  $('#sort-order-btn').on('click', toggleSortOrder);

  fetchUsers();
}

function performSearch() {
  currentSearch = $('#user-search').val().trim();
  fetchUsers();
}

function performSort() {
  currentSortBy = $('#sort-by').val();
  fetchUsers();
}

function toggleSortOrder() {
  currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  $('#sort-order-btn i').toggleClass('fa-sort-alpha-asc fa-sort-alpha-desc');
  fetchUsers();
}

function fetchUsers() {
  $.ajax({
    url: '/api/admin/users',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: {
      search: currentSearch,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder
    },
    success: function (response) {
      displayUsers(response.users, response.currentAdminLevel);
    },
    error: function () {
      $('#user-management').html(
        '<div class="alert alert-danger" role="alert">Error loading users.</div>'
      );
    },
  });
}

function displayUsers(users, currentAdminLevel) {
  const userManagement = $('#user-management');
  userManagement.empty();

  const currentAdminId = localStorage.getItem('userId');

  if (users.length === 0) {
    userManagement.html('<div class="col-md-12"><div class="alert alert-info" role="alert">No users found.</div></div>');
    return;
  }

  users.forEach((user) => {
    const panel = $(`
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="panel panel-primary">
          <div class="panel-heading">
            <h3 class="panel-title">${escapeHtml(user.username)}</h3>
          </div>
          <div class="panel-body">
            <div class="user-info">
              <p><i class="fa fa-envelope"></i><b> Email:</b> ${escapeHtml(user.email)}</p>
              <p><i class="fa fa-calendar"></i><b> Signup Date:</b> ${new Date(user.signupDate).toLocaleString()}</p>
              <p><i class="fa fa-money"></i><b> Currency:</b> ${user.currency}</p>
              <p>
                <span class="label label-${user.isBanned ? 'danger' : 'success'}">
                  <i class="fa fa-${user.isBanned ? 'ban' : 'check'}"></i> ${user.isBanned ? 'Banned' : 'Active'}
                </span>
                <span class="label label-${user.adminLevel === 'admin' ? 'primary' : user.adminLevel === 'moderator' ? 'info' : 'default'}">
                  <i class="fa fa-${user.adminLevel === 'admin' ? 'shield' : user.adminLevel === 'moderator' ? 'gavel' : 'user'}"></i> ${user.adminLevel.charAt(0).toUpperCase() + user.adminLevel.slice(1)}
                </span>
              </p>
            </div>
            <div class="user-actions mt-3">
              ${currentAdminLevel === 'admin' ? `
                <button class="btn btn-sm btn-${user.isBanned ? 'success' : 'warning'} ban-user" data-user-id="${user.userId}" data-is-banned="${user.isBanned}" ${user.adminLevel === 'admin' ? 'disabled' : ''}>
                  <i class="fa fa-${user.isBanned ? 'unlock' : 'ban'}"></i> ${user.isBanned ? 'Unban User' : 'Ban User'}
                </button>
                ${user.adminLevel === 'user' ? `
                  <button class="btn btn-sm btn-info promote-moderator" data-user-id="${user.userId}"><i class="fa fa-level-up"></i> Promote to Moderator</button>
                ` : user.adminLevel === 'moderator' ? `
                  <button class="btn btn-sm btn-primary promote-admin" data-user-id="${user.userId}"><i class="fa fa-level-up"></i> Promote to Admin</button>
                ` : ''}
                ${user.adminLevel !== 'user' ? `
                <button class="btn btn-sm btn-danger demote-user" data-user-id="${user.userId}" ${user.userId == currentAdminId ? 'disabled' : ''}><i class="fa fa-level-down"></i> Demote User</button>
                ` : ''}
                <button class="btn btn-sm btn-danger delete-user" data-user-id="${user.userId}" ${user.adminLevel !== 'user' ? 'disabled' : ''}><i class="fa fa-trash"></i> Delete User</button>
              ` : ''}
              <button class="btn btn-sm btn-info view-messages" data-user-id="${user.userId}"><i class="fa fa-envelope"></i> View Messages</button>
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
  $('.ban-user').on('click', function () {
    const userId = $(this).data('user-id');
    const isBanned = $(this).data('is-banned');
    if (isBanned) {
      unbanUser(userId);
    } else {
      showBanModal(userId);
    }
  });

  $('.promote-admin').on('click', function () {
    const userId = $(this).data('user-id');
    promoteToAdmin(userId);
  });

  $('.promote-moderator').on('click', function () {
    const userId = $(this).data('user-id');
    promoteToModerator(userId);
  });

  $('.demote-user').on('click', function () {
    const userId = $(this).data('user-id');
    demoteUser(userId);
  });

  $('.delete-user').on('click', function () {
    const userId = $(this).data('user-id');
    deleteUser(userId);
  });

  $('.view-messages').on('click', function () {
    const userId = $(this).data('user-id');
    loadUserMessages(userId);
  });
}

function showBanModal(userId) {
  const modal = `
    <div class="modal fade" id="banUserModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title"><i class="fa fa-ban"></i> Ban User</h4>
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
                    <button type="button" class="btn btn-danger" id="confirmBan"><i class="fa fa-check"></i> Ban User</button>
                </div>
            </div>
        </div>
    </div>
    `;

  $('body').append(modal);
  $('#banUserModal').modal('show');

  $('#confirmBan').on('click', function () {
    const banReason = $('#banReason').val();
    if (banReason) {
      banUser(userId, banReason);
      $('#banUserModal').modal('hide');
    } else {
      alert('Please provide a reason for the ban.');
    }
  });

  $('#banUserModal').on('hidden.bs.modal', function () {
    $(this).remove();
  });
}

function banUser(userId, banReason) {
  $.ajax({
    url: `/api/admin/users/${userId}/ban`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    data: JSON.stringify({ ban: true, banReason }),
    contentType: 'application/json',
    success: function () {
      showAlert('success', 'User banned successfully.');
      loadUsers();
    },
    error: function (xhr) {
      showAlert('danger', `Error banning user: ${xhr.responseJSON.error}`);
    },
  });
}

function unbanUser(userId) {
  if (confirm('Are you sure you want to unban this user?')) {
    $.ajax({
      url: `/api/admin/users/${userId}/ban`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      data: JSON.stringify({ ban: false }),
      contentType: 'application/json',
      success: function () {
        showAlert('success', 'User unbanned successfully.');
        loadUsers();
      },
      error: function (xhr) {
        showAlert('danger', `Error unbanning user: ${xhr.responseJSON.error}`);
      },
    });
  }
}

function promoteToAdmin(userId) {
  if (confirm('Are you sure you want to promote this user to admin?')) {
    $.ajax({
      url: `/api/admin/promote-admin/${userId}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function () {
        showAlert('success', 'User promoted to admin successfully.');
        loadUsers();
      },
      error: function (xhr) {
        showAlert('danger', `Error promoting user to admin: ${xhr.responseJSON.error}`);
      },
    });
  }
}

function promoteToModerator(userId) {
  if (confirm('Are you sure you want to promote this user to moderator?')) {
    $.ajax({
      url: `/api/admin/promote-moderator/${userId}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function () {
        showAlert('success', 'User promoted to moderator successfully.');
        loadUsers();
      },
      error: function (xhr) {
        showAlert('danger', `Error promoting user to moderator: ${xhr.responseJSON.error}`);
      },
    });
  }
}

function demoteUser(userId) {
  const currentUserId = localStorage.getItem('userId');
  if (userId === currentUserId) {
    showAlert('warning', 'You cannot demote yourself.');
    return;
  }

  if (confirm('Are you sure you want to demote this user?')) {
    $.ajax({
      url: `/api/admin/demote/${userId}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function () {
        showAlert('success', 'User demoted successfully.');
        loadUsers();
      },
      error: function (xhr) {
        showAlert('danger', `Error demoting user: ${xhr.responseJSON.error}`);
      },
    });
  }
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    $.ajax({
      url: `/api/admin/users/${userId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function () {
        showAlert('success', 'User deleted successfully.');
        loadUsers();
      },
      error: function () {
        showAlert('danger', `Error deleting user: ${xhr.responseJSON.error}`);
      },
    });
  }
}

function loadUserMessages(userId) {
  $.ajax({
    url: `/api/admin/users/${userId}/messages`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (messages) {
      displayUserMessages(messages);
    },
    error: function (xhr) {
      showAlert('danger', `Error loading user messages: ${xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'}`);
    },
  });
}

function displayUserMessages(messages) {
  const modal = $(`
    <div class="modal fade" id="userMessagesModal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title"><i class="fa fa-envelope"></i> User Messages</h4>
          </div>
          <div class="modal-body">
            <div class="panel panel-primary">
              <div class="panel-heading">
                <h3 class="panel-title">Message History</h3>
              </div>
              <div class="panel-body">
                <div class="table-responsive">
                  <table class="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 20%;">Sender</th>
                        <th class="text-center" style="width: 20%;">Receiver</th>
                        <th class="text-center" style="width: 40%;">Message</th>
                        <th class="text-center" style="width: 20%;">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${messages.map(message => `
                        <tr>
                          <td>
                            <div class="d-flex align-items-center justify-content-center">
                              <img src="${message.sender && message.sender.profilePicture || 'https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png'}" class="img-circle" style="width: 30px; height: 30px; margin-right: 5px;">
                              <strong>${message.sender ? escapeHtml(message.sender.username) : 'Unknown'}</strong>
                            </div>
                          </td>
                          <td>
                            <div class="d-flex align-items-center justify-content-center">
                              <img src="${message.recipient && message.recipient.profilePicture || 'https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png'}" class="img-circle" style="width: 30px; height: 30px; margin-right: 5px;">
                              <strong>${message.recipient ? escapeHtml(message.recipient.username) : 'Unknown'}</strong>
                            </div>
                          </td>
                          <td>${escapeHtml(message.message)}</td>
                          <td class="text-center"><small><i class="fa fa-clock-o"></i> ${new Date(message.sentAt).toLocaleString()}</small></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `);

  $('body').append(modal);
  $('#userMessagesModal').modal('show');

  $('#userMessagesModal').on('hidden.bs.modal', function () {
    $(this).remove();
  });
}

function showAlert(type, message) {
  const alertDiv = $(`<div class="alert alert-${type} alert-dismissible" role="alert">
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            ${message}
                        </div>`);
  $('#user-management').before(alertDiv);
  setTimeout(() => alertDiv.alert('close'), 5000);
}
