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
                requestsList.empty();
                requests.forEach(function(request) {
                    requestsList.append(`
                        <li class="list-group-item">
                            ${escapeHtml(request.username)}
                            <button class="btn btn-sm btn-success accept-request" data-id="${request._id}">Accept</button>
                            <button class="btn btn-sm btn-danger decline-request" data-id="${request._id}">Decline</button>
                        </li>
                    `);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching friend requests:', error);
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
                friendsList.empty();
                friends.forEach(function(friend) {
                    friendsList.append(`
                        <li class="list-group-item">
                            ${escapeHtml(friend.username)}
                            <button class="btn btn-sm btn-warning unfriend" data-id="${friend._id}">Unfriend</button>
                        </li>
                    `);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching friends list:', error);
            }
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

    fetchFriendRequests();
    fetchFriendsList();
});