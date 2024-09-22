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
          fetchAndDisplayGames();
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
        Friends.fetchFriendsList(username, 'friends-list', 10)
          .then(friends => {
            if (friends.length > 10) {
              $('#friends-list').append('<p class="text-center mt-3">Showing 10 of ' + friends.length + ' friends</p>');
            }
          })
          .catch(error => {
            console.error('Error fetching friends list:', error);
            $('#friends-list').html('<p>Error loading friends list.</p>');
          });
      }

      function fetchAndDisplayGames() {
        $.ajax({
            url: '/api/games',
            method: 'GET',
            success: function (games) {
                displayGames(games);
            },
            error: function (xhr, status, error) {
                console.error('Error fetching games:', error);
                $('#games-container').html('<p>Error loading games.</p>');
            }
        });
    }
    
    function displayGames(games) {
        const gamesContainer = $('#games-container');
        gamesContainer.empty();
    
        const gamesHtml = `
          <div class="panel panel-primary">
              <div class="panel-heading">
                  <h3 class="panel-title">Featured Games</h3>
              </div>
              <div class="panel-body">
                  <div class="row">
                      ${games.slice(0, 4).map(game => `
                          <div class="col-md-3 col-sm-6 mb-4">
                              <div class="thumbnail" style="position: relative;">
                              ${game.year ? `<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #337ab7;">${game.year}</span>` : '<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #d9534f;">No Year</span>'}
                                  <a href="/game?id=${game._id}">
                                      <img src="${game.thumbnailUrl}" alt="${escapeHtml(game.title)}" class="img-responsive">
                                      <div class="caption">
                                          <h4>${escapeHtml(game.title)}</h4>
                                          <p>By ${escapeHtml(game.creator.username)}</p>
                                      </div>
                                  </a>
                              </div>
                          </div>
                      `).join('')}
                  </div>
                  <div class="text-center">
                      <a href="/games" class="btn btn-primary">View All Games</a>
                  </div>
              </div>
          </div>
      `;
    
        gamesContainer.html(gamesHtml);
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