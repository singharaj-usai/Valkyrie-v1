$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
  
    if (!username) {
      $('#all-friends-list').html('<p>No username specified.</p>');
      return;
    }
  
    fetchAllFriends(username);
  
    function fetchAllFriends(username) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
  
      $.ajax({
        url: `/api/friends/${encodeURIComponent(username)}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        success: function (friends) {
          displayAllFriends(friends);
        },
        error: function (xhr, status, error) {
          console.error('Error fetching all friends:', error);
          $('#all-friends-list').html('<p class="alert alert-danger">Error loading friends list.</p>');
        },
      });
    }
  
    function displayAllFriends(friends) {
      const friendsList = $('#all-friends-list');
      friendsList.empty();
  
      if (friends.length === 0) {
        friendsList.append('<div class="panel panel-primary"><div class="panel-body">This user has no friends.</div></div>');
        return;
      }
  
      const panel = $('<div class="panel panel-primary"></div>');
      const panelHeading = $('<div class="panel-heading"><h3 class="panel-title">All Friends</h3></div>');
      const panelBody = $('<div class="panel-body"></div>');
      const row = $('<div class="row"></div>');
  
      friends.forEach((friend) => {
        const friendCard = `
          <div class="col-md-3 col-sm-6 mb-4">
            <div class="panel panel-primary">
              <div class="panel-body text-center">
                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" class="img-circle img-responsive center-block" alt="${escapeHtml(friend.username)}" style="width: 100px; height: 100px;">
                <h4>${escapeHtml(friend.username)}</h4>
                <p><span class="label label-${friend.isOnline ? 'success' : 'default'}">${friend.isOnline ? 'Online' : 'Offline'}</span></p>
                <a href="/user-profile?username=${encodeURIComponent(friend.username)}" class="btn btn-primary btn-block">View Profile</a>
              </div>
            </div>
          </div>
        `;
        row.append(friendCard);
      });
  
      panelBody.append(row);
      panel.append(panelHeading).append(panelBody);
      friendsList.append(panel);
    }
  
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  });