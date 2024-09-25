function fetchFriendRequests() {
    console.log('Fetching friend requests');
    const token = localStorage.getItem('token');
    $.ajax({
        url: '/api/friend-requests',
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(requests) {
            console.log('Friend requests received:', requests);
            displayFriendRequests(requests);
        },
        error: function(xhr, status, error) {
            console.error('Error fetching friend requests:', error);
            $('#friend-requests').html('<p>Error loading friend requests.</p>');
        }
    });
}

function displayFriendRequests(requests) {
    const requestsList = $('#friend-requests');
    $('#requests-tab').text(`Friend Requests (${requests.length})`);

    let html = `
    <div class="panel panel-primary">
        <div class="panel-heading">
            <h3 class="panel-title">Friend Requests</h3>
        </div>
        <div class="panel-body">
    `;

    if (requests.length === 0) {
        html += '<p class="text-center">No friend requests.</p>';
    } else {
        html += '<div class="row">';
        requests.forEach(function(request) {
            html += createFriendRequestCard(request);
        });
        html += '</div>';
    }

    html += '</div></div>';
    requestsList.html(html);
}

function createFriendRequestCard(request) {
    return `
        <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 mb-3">
            <div class="panel panel-default">
                <div class="panel-body">
                    <div class="media">
                        <div class="media-left">
                            <a href="/user-profile?username=${encodeURIComponent(request.username)}" title="${escapeHtml(request.username)}">
                                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="50" height="50" 
                                    alt="${escapeHtml(request.username)}" 
                                    class="media-object img-circle" 
                                    style="width: 64px; height: 64px; background-color: #f5f5f5;">
                            </a>
                        </div>
                        <div class="media-body">
                            <h4 class="media-heading">
                                <a href="/user-profile?username=${encodeURIComponent(request.username)}" title="${escapeHtml(request.username)}">
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
}