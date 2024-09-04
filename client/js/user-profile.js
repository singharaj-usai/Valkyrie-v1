$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (username) {
        fetchUserProfile(username);
    } else {
        $('#user-profile').html('<p>No user specified.</p>');
    }

    function fetchUserProfile(username) {
        $.ajax({
            url: `/api/user/${username}`,
            method: 'GET',
            success: function (user) {
                displayUserProfile(user);
            },
            error: function (xhr, status, error) {
                $('#user-profile').html('<p>Error fetching user profile. Please try again.</p>');
            }
        });
    }

    function displayUserProfile(user) {
        const profileHtml = `
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(user.username)}</h3>
                </div>
                <div class="panel-body">
                    <p><strong>Signed Up:</strong> ${new Date(user.signupDate).toLocaleString()}</p>
                    <p><strong>Last Logged In:</strong> ${user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : 'Never'}</p>
                </div>
            </div>
        `;
        $('#user-profile').html(profileHtml);
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