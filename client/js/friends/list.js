function fetchFriendsList() {
    //console.log('Fetching friends list');
    const token = localStorage.getItem('token');
    $.ajax({
        url: '/api/friends',
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(friends) {
         //   console.log('Friends list received:', friends);
            displayFriendsList(friends);
        },
        error: function(xhr, status, error) {
            console.error('Error fetching friends list:', error);
            $('#friends-list').html('<p>Error loading friends list.</p>');
        }
    });
}

function displayFriendsList(friends) {
    const friendsList = $('#friends-list');
    $('#friends-tab').text(`Friends (${friends.length})`);

    let html = `
    <div class="panel panel-primary">
        <div class="panel-heading">
            <h3 class="panel-title">Friends List</h3>
        </div>
        <div class="panel-body">
    `;

    if (friends.length === 0) {
        html += '<p class="text-center">You have no friends yet.</p>';
    } else {
        html += '<div class="row">';
        const statusPromises = friends.map(friend => fetchUserStatus(friend.username));
        
        Promise.all(statusPromises).then(statuses => {
            friends.forEach((friend, index) => {
                const isOnline = statuses[index];
                html += createFriendCard(friend, isOnline);
            });
            html += '</div>';
            friendsList.html(html);
        });
    }
}

function createFriendCard(friend, isOnline) {
    return `
        <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 mb-3">
            <div class="panel panel-default">
                <div class="panel-body">
                    <div class="media">
                        <div class="media-left">
                            <a href="/user-profile?username=${encodeURIComponent(friend.username)}" title="${escapeHtml(friend.username)}">
                                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="50" height="50" 
                                    alt="${escapeHtml(friend.username)}" 
                                    class="media-object img-circle" 
                                    style="width: 64px; height: 64px; background-color: #f5f5f5;">
                            </a>
                        </div>
                        <div class="media-body">
                            <h4 class="media-heading">
                                <a href="/user-profile?username=${encodeURIComponent(friend.username)}" title="${escapeHtml(friend.username)}">
                                    ${escapeHtml(friend.username)}
                                </a>
                            </h4>
                            <p class="${isOnline ? 'text-success' : 'text-muted'}">
                                <i class="bi bi-circle-fill"></i> ${isOnline ? '[ Online ]' : '[ Offline ]'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function fetchUserStatus(username) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `/api/user-status/${username}`,
            method: 'GET',
            success: function (response) {
                resolve(response.isOnline);
            },
            error: function (xhr, status, error) {
                console.error('Error fetching user status:', error);
                resolve(false);
            }
        });
    });
}