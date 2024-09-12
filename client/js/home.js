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
        },
        error: function() {
          localStorage.removeItem("username");
          localStorage.removeItem("token");
          window.location.href = '/login.html';
        }
      });
    } else {
      window.location.href = '/login.html';
    }
  
    function fetchUserBlurb() {
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
        <button id="edit-blurb" class="btn btn-primary btn-sm">Edit Blurb</button>
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
            <button id="save-blurb" class="btn btn-primary btn-sm mt-2">Save</button>
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
                alert('Error updating blurb: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
              }
            });
          });
      
          $('#cancel-blurb').on('click', function() {
            displayBlurb(currentBlurb);
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