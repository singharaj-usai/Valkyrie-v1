$(document).ready(function () {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
  
    if (username && token) {
      $.ajax({
        url: "/api/validate-session",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        success: function(response) {
          $('#profile-username').text(`Welcome, ${username}!`);
          fetchUserBlurb();
          fetchFriendsList();
        },
        error: function() {
          localStorage.removeItem("username");
          localStorage.removeItem("token");
          window.location.href = '/login';
        }
      });
    } else {
      window.location.href = '/login';
    }
  
    function fetchUserBlurb() {
        const token = localStorage.getItem('token');
        $.ajax({
          url: `/api/user/${username}`,
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${token}`
          },
          success: function (user) {
            displayBlurb(user.blurb);
          },
          error: function (xhr, status, error) {
            console.error('Error fetching user blurb:', error);
          }
        });
      }
  
    function displayBlurb(blurb) {
      const blurbHtml = `
        <p id="blurb-text">${blurb ? escapeHtml(blurb) : 'No blurb set.'}</p>
        <button id="edit-blurb" class="btn btn-default btn-sm">Edit Blurb</button>
      `;
      $('#blurb-container').html(blurbHtml);
      initBlurbEdit(blurb);
    }

      function initBlurbEdit(currentBlurb) {
        $('#edit-blurb').on('click', function() {
          const blurbContainer = $('#blurb-container');
          blurbContainer.html(`
            <textarea id="blurb-textarea" class="form-control" rows="3" maxlength="500">${escapeHtml(currentBlurb || '')}</textarea>
            <p id="char-count">0/500</p>
            <button id="save-blurb" class="btn btn-success btn-sm mt-2">Save</button>
            <button id="cancel-blurb" class="btn btn-secondary btn-sm mt-2">Cancel</button>
          `);
      
          const textarea = $('#blurb-textarea');
          const charCount = $('#char-count');
      
          textarea.on('input', function() {
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
                displayBlurb(response.blurb);
              },
              error: function(xhr, status, error) {
                console.error('Error updating blurb:', error);
                console.error('Response:', xhr.responseText);
                alert('Error updating blurb: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
              }
            });
          });
      
          $('#cancel-blurb').on('click', function() {
            displayBlurb(currentBlurb);
          });
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
            if (friends.length === 0) {
              friendsList.html('<p>You have no friends yet.</p>');
            } else {
              let html = '<div class="row">';
              friends.slice(0, 10).forEach(function(friend) {
                html += `
                  <div class="col-xs-6 col-sm-4 col-md-3 text-center mb-3">
                    <a href="/user-profile?username=${encodeURIComponent(friend.username)}" title="${escapeHtml(friend.username)}">
                      <img src="https://via.placeholder.com/100x100.png?text=${encodeURIComponent(friend.username[0])}" 
                           alt="${escapeHtml(friend.username)}" 
                           class="img-circle" 
                           style="width: 100px; height: 100px;">
                    </a>
                    <p class="mt-2">
                      <a href="/user-profile?username=${encodeURIComponent(friend.username)}" title="${escapeHtml(friend.username)}">
                        ${escapeHtml(friend.username)}
                      </a>
                    </p>
                  </div>
                `;
              });
              html += '</div>';
              if (friends.length > 10) {
                html += '<p class="text-center mt-3">Showing 10 of ' + friends.length + ' friends</p>';
              }
              friendsList.html(html);
            }
          },
          error: function(xhr, status, error) {
            console.error('Error fetching friends list:', error);
            $('#friends-list').html('<p>Error loading friends list.</p>');
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
});