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
        const sessionToken = localStorage.getItem("sessionToken");
        $.ajax({
            url: `/api/user/${username}`,
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${sessionToken}`
            },
            success: function (user) {
                currentUser = user;
                displayUserProfile(user);
            },
            error: function (xhr, status, error) {
                $('#user-profile').html('<p>Error fetching user profile. Please try again.</p>');
            }
        });
    }

    function displayUserProfile(user) {
        const isOwnProfile = user.username === localStorage.getItem('username');
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
                ${isOwnProfile ? `
                  <button id="edit-blurb" class="btn btn-primary btn-sm">Edit Blurb</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
        $('#user-profile').html(profileHtml);
      
        if (isOwnProfile) {
          initBlurbEdit(user.blurb);
        }
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