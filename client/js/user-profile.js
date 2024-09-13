$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username') || localStorage.getItem('username');
    let currentUser;

    if (username) {
        fetchUserProfile(username);
    } else {
        $('#user-profile').html('<p>No user specified and you are not logged in.</p>');
    }

    function fetchUserProfile(username) {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error('No token found in localStorage');
            $('#user-profile').html('<p>You are not logged in. Please <a href="/login.html">login</a> to view profiles.</p>');
            return;
        }
        $.ajax({
            url: `/api/user/${username}`,
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function (user) {
                currentUser = user;
                displayUserProfile(user);
            },
            error: function (xhr, status, error) {
                console.error('Error fetching user profile:', xhr.responseText);
                console.error('Status:', status);
                console.error('Error:', error);
                $('#user-profile').html('<p>Error fetching user profile. Please try again. If the problem persists, please <a href="/login.html">login</a> again.</p>');
            }
        });
    }

    function displayUserProfile(user) {
        const isOwnProfile = user.username === localStorage.getItem('username');
        let actionButton = '';
    
        if (isOwnProfile) {
            actionButton = `<button id="edit-blurb" class="btn btn-primary btn-sm">Edit Blurb</button>`;
        } else if (user.isFriend) {
            actionButton = `<button id="unfriend" class="btn btn-warning btn-sm">Unfriend</button>`;
        } else if (user.friendRequestReceived) {
            actionButton = `
                <button id="accept-friend-request" class="btn btn-success btn-sm">Accept Friend Request</button>
                <button id="decline-friend-request" class="btn btn-danger btn-sm">Decline Friend Request</button>
            `;
        } else if (user.friendRequestSent) {
            actionButton = `<button class="btn btn-secondary btn-sm" disabled>Friend Request Sent</button>`;
        } else {
            actionButton = `<button id="send-friend-request" class="btn btn-primary btn-sm">Send Friend Request</button>`;
        }
    
        const profileHtml = `
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">${escapeHtml(user.username)}</h3>
            </div>
            <div class="panel-body">
                <p><strong>Signed Up:</strong> ${new Date(user.signupDate).toLocaleString()}</p>
                <p><strong>Last Logged In:</strong> ${user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : 'Never'}</p>
                <div id="blurb-container">
                    <h4>About Me</h4>
                    <p id="blurb-text">${user.blurb ? escapeHtml(user.blurb) : 'No blurb set.'}</p>
                    ${actionButton}
                </div>
            </div>
        </div>
        `;
        $('#user-profile').html(profileHtml);
    
        if (isOwnProfile) {
            initBlurbEdit(user.blurb);
        } else {
            initFriendActions(user);
        }
    }

function initFriendActions(user) {
    $('#send-friend-request').on('click', function() {
        sendFriendRequest(user._id);
    });

    $('#accept-friend-request').on('click', function() {
        acceptFriendRequest(user._id);
    });

    $('#decline-friend-request').on('click', function() {
        declineFriendRequest(user._id);
    });

    $('#unfriend').on('click', function() {
        unfriend(user._id);
    });
}

function sendFriendRequest(userId) {
    sendAjaxRequest('/api/send-friend-request/' + userId, 'POST', 'Friend request sent successfully');
}

function acceptFriendRequest(userId) {
    sendAjaxRequest('/api/accept-friend-request/' + userId, 'POST', 'Friend request accepted');
}

function declineFriendRequest(userId) {
    sendAjaxRequest('/api/decline-friend-request/' + userId, 'POST', 'Friend request declined');
}

function unfriend(userId) {
    sendAjaxRequest('/api/unfriend/' + userId, 'POST', 'Unfriended successfully');
}

function sendAjaxRequest(url, method, successMessage) {
    const token = localStorage.getItem('token');
    $.ajax({
        url: url,
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            alert(successMessage);
            fetchUserProfile(username);
        },
        error: function(xhr, status, error) {
            if (xhr.responseJSON && xhr.responseJSON.error === 'You have already received a friend request from this user') {
                alert('You have already received a friend request from this user. Please check your friend requests.');
            } else {
                alert('Error: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
            }
        }
    });
}
    

    function initBlurbEdit(currentBlurb) {
        $('#edit-blurb').on('click', function() {
            const blurbContainer = $('#blurb-container');
            blurbContainer.html(`
                <h4>Edit About Me</h4>
                <textarea id="blurb-textarea" class="form-control" rows="3" maxlength="500">${escapeHtml(currentBlurb || '')}</textarea>
                <p id="char-count">0/500</p>
                <button id="save-blurb" class="btn btn-primary btn-sm mt-2">Save</button>
                <button id="cancel-blurb" class="btn btn-secondary btn-sm mt-2">Cancel</button>
            `);
      
            const textarea = $('#blurb-textarea');
            const charCount = $('#char-count');
      
            textarea.on('input', function() {
                const remaining = 500 - this.value.length;
                charCount.text(`${this.value.length}/500`);
            });
      
            textarea.trigger('input');
      
            $('#save-blurb').on('click', function() {
                const newBlurb = textarea.val();
                const token = localStorage.getItem('token');
                $.ajax({
                    url: '/api/user/blurb',
                    method: 'PUT',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify({ blurb: newBlurb }),
                    success: function(response) {
                        currentUser.blurb = response.blurb;
                        displayUserProfile(currentUser);
                    },
                    error: function(xhr, status, error) {
                        alert('Error updating blurb: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
                    }
                });
            });
      
            $('#cancel-blurb').on('click', function() {
                displayUserProfile(currentUser);
            });
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
});