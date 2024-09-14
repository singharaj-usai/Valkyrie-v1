$(document).ready(function() {
    const token = localStorage.getItem('token');

    function fetchFriendRequests() {
        $.ajax({
            url: '/api/friend-requests',
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(requests) {
                const requestsList = $('#friend-requests');

                $('#requests-tab').text(`Friend Requests (${requests.length})`);

                requestsList.empty();
                if (requests.length === 0) {
                    requestsList.append('<p>No friend requests.</p>');
                } else {
                    let html = '<div class="row">';
                    requests.forEach(function(request) {
                        html += `
                            <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                                <div class="panel panel-default">
                                    <div class="panel-body">
                                        <div class="media">
                                            <div class="media-left">
                                                <a href="/user-profile.html?username=${encodeURIComponent(request.username)}" title="${escapeHtml(request.username)}">
                                                    <img src="https://via.placeholder.com/100x100.png?text=${encodeURIComponent(request.username[0])}" 
                                                         alt="${escapeHtml(request.username)}" 
                                                         class="media-object img-circle" 
                                                         style="width: 64px; height: 64px;">
                                                </a>
                                            </div>
                                            <div class="media-body">
                                                <h4 class="media-heading">
                                                    <a href="/user-profile.html?username=${encodeURIComponent(request.username)}" title="${escapeHtml(request.username)}">
                                                        ${escapeHtml(request.username)}
                                                    </a>
                                                </h4>
                                            </div>
                                        </div>
                                        <div class="text-center" style="margin-top: 10px; width: 100%;">
                                            <button class="btn btn-xs btn-success accept-request" data-id="${request._id}" style="width: 48%; margin-right: 2%;">Accept</button>
                                            <button class="btn btn-xs btn-danger decline-request" data-id="${request._id}" style="width: 48%;">Decline</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    requestsList.html(html);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching friend requests:', error);
                $('#friend-requests').html('<p>Error loading friend requests.</p>');
            }
        });
    }
    
    function fetchFriendsList() {
        $.ajax({
            url: '/api/friends',
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(friends) {
                const friendsList = $('#friends-list');

                $('#friends-tab').text(`Friends (${friends.length})`);

                if (friends.length === 0) {
                    friendsList.html('<p>You have no friends yet.</p>');
                } else {
                    let html = '<div class="row">';
                    const statusPromises = friends.map(friend => fetchUserStatus(friend.username));
                    
                    Promise.all(statusPromises).then(statuses => {
                        friends.forEach((friend, index) => {
                            const isOnline = statuses[index];
                            html += `
                                <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                                    <div class="panel panel-default">
                                        <div class="panel-body">
                                            <div class="media">
                                                <div class="media-left">
                                                    <a href="/user-profile.html?username=${encodeURIComponent(friend.username)}" title="${escapeHtml(friend.username)}">
                                                        <img src="https://via.placeholder.com/100x100.png?text=${encodeURIComponent(friend.username[0])}" 
                                                             alt="${escapeHtml(friend.username)}" 
                                                             class="media-object img-circle" 
                                                             style="width: 64px; height: 64px;">
                                                    </a>
                                                </div>
                                                <div class="media-body">
                                                    <h4 class="media-heading">
                                                        <a href="/user-profile.html?username=${encodeURIComponent(friend.username)}" title="${escapeHtml(friend.username)}">
                                                            ${escapeHtml(friend.username)}
                                                        </a>
                                                    </h4>
                                                    <p class="${isOnline ? 'text-success' : 'text-muted'}">
                                                        <i class="bi bi-circle-fill"></i> ${isOnline ? 'Online' : 'Offline'}
                                                    </p>
                                                </div>
                                            </div>
                                           
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        html += '</div>';
                        friendsList.html(html);
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching friends list:', error);
                $('#friends-list').html('<p>Error loading friends list.</p>');
            }
        });
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

    $(document).on('click', '.accept-request', function() {
        const userId = $(this).data('id');
        sendFriendAction('/api/accept-friend-request/' + userId, 'Friend request accepted');
    });

    $(document).on('click', '.decline-request', function() {
        const userId = $(this).data('id');
        sendFriendAction('/api/decline-friend-request/' + userId, 'Friend request declined');
    });

    $(document).on('click', '.unfriend', function() {
        const userId = $(this).data('id');
        sendFriendAction('/api/unfriend/' + userId, 'Unfriended successfully');
    });

    function sendFriendAction(url, successMessage) {
        $.ajax({
            url: url,
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(response) {
                alert(successMessage);
                fetchFriendRequests();
                fetchFriendsList();
            },
            error: function(xhr, status, error) {
                alert('Error: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
            }
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialize tabs
    $('#friendTabs a').on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    fetchFriendRequests();
    fetchFriendsList();
});