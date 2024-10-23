$(document).ready(function () {
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  if (username && token) {
    $.ajax({
      url: '/api/validate-session',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        $('#profile-username').text(`Welcome, ${username}`);
        fetchUserBlurb();
        fetchFriendsList();
        fetchAndDisplayGames();
        displaySocialMediaLinks();
      },
      error: function () {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        window.location.href = '/login';
      },
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
        Authorization: `Bearer ${token}`,
      },
      success: function (user) {
        displayBlurb(user.blurb);
      },
      error: function (xhr, status, error) {
        console.error('Error fetching user blurb:', error);
      },
    });
  }

  function displayBlurb(blurb) {
    const blurbHtml = `
        <p id="blurb-text">${blurb ? escapeHtml(blurb) : 'No blurb set.'}</p>
        <button id="edit-blurb" class="btn btn-default btn-sm"><i class="fa fa-pencil"></i> Edit Blurb</button>
      `;
    $('#blurb-container').html(blurbHtml);
    initBlurbEdit(blurb);
  }

  function initBlurbEdit(currentBlurb) {
    $('#edit-blurb').on('click', function () {
      const blurbContainer = $('#blurb-container');
      blurbContainer.html(`
            <textarea id="blurb-textarea" class="form-control" rows="3" maxlength="500">${escapeHtml(
              currentBlurb || ''
            )}</textarea>
            <p id="char-count">0/500</p>
            <button id="save-blurb" class="btn btn-success btn-sm mt-2">Save</button>
            <button id="cancel-blurb" class="btn btn-secondary btn-sm mt-2">Cancel</button>
          `);

      const textarea = $('#blurb-textarea');
      const charCount = $('#char-count');

      textarea.on('input', function () {
        charCount.text(`${this.value.length}/500`);
      });

      textarea.trigger('input');

      $('#save-blurb').on('click', function () {
        const newBlurb = textarea.val();
        const token = localStorage.getItem('token');
        $.ajax({
          url: '/api/user/blurb',
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: JSON.stringify({ blurb: newBlurb }),
          success: function (response) {
            displayBlurb(response.blurb);
          },
          error: function (xhr, status, error) {
            console.error('Error updating blurb:', error);
            console.error('Response:', xhr.responseText);
            alert(
              'Error updating blurb: ' +
                (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error')
            );
          },
        });
      });

      $('#cancel-blurb').on('click', function () {
        displayBlurb(currentBlurb);
      });
    });
  }

  function fetchFriendsList() {
    const username = localStorage.getItem('username');
    Friends.fetchFriendsList(username, 'friends-list', 10)
      .then((friends) => {
        if (friends.length > 10) {
          $('#friends-list').append(
            '<p class="text-center mt-3">Showing 10 of ' +
              friends.length +
              ' friends</p>'
          );
        }
      })
      .catch((error) => {
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
      },
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
                      ${games
                        .slice(0, 4)
                        .map(
                          (game) => `
                          <div class="col-md-3 col-sm-6 mb-4">
                              <div class="thumbnail" style="position: relative;">
                              ${
                                game.year
                                  ? `<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #337ab7;">${game.year}</span>`
                                  : '<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #d9534f;">No Year</span>'
                              }
                                  <a href="/game?id=${game._id}">
                                <img src="${game.thumbnailUrl}" alt="${
                            game.title
                          }" class="embed-responsive-item">
                                      <div class="caption">
                                        <h4><a href="/game?id=${game._id}">${
                            game.title
                          }</a></h4>
                                        <p>Creator: <a href="/user-profile?username=${encodeURIComponent(
                                          game.creator.username
                                        )}">${game.creator.username}</a></p>
                                      </div>
                                  </a>
                              </div>
                          </div>
                      `
                        )
                        .join('')}
                  </div>
                  <div class="text-center">
                      <a href="/games" class="btn btn-primary">View All Games</a>
                  </div>
              </div>
          </div>
      `;

    gamesContainer.html(gamesHtml);
  }

  function displaySocialMediaLinks() {
    const socialMediaContainer = $('#social-media-container');
    socialMediaContainer.empty();

    const socialMediaHtml = `
        <div class="panel panel-primary">
            <div class="panel-heading">
                <h3 class="panel-title">Social Media Links</h3>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-md-4 col-sm-4 col-xs-12 mb-3">
                        <div class="card">
                            <div class="card-body text-center p-3">
                                <h4><i class="bi bi-discord"></i> Discord</h4>
                                <p>Join our Discord server and talk to people in our community!</p>
                                <a target="_blank" href="https://discord.gg/rpRz3mhuBz" class="btn btn-info mt-2">Join Discord</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-4 col-xs-12 mb-3">
                        <div class="card">
                            <div class="card-body text-center p-3">
                                <h4><i class="bi bi-youtube"></i> YouTube</h4>
                                <p>Check out some of our videos, which detail some new and upcoming features.</p>
                                <a target="_blank" href="https://www.youtube.com/channel/UCBXD0DGmDfO_IqTgjOOKRYg" class="btn btn-danger mt-2">Watch Videos</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-4 col-xs-12 mb-3">
                        <div class="card">
                            <div class="card-body text-center p-3">
                                <h4><i class="bi bi-twitter"></i> Twitter</h4>
                                <p>We tweet whenever we post a video, and may even hint at some upcoming events on our Twitter.</p>
                                <a target="_blank" href="https://twitter.com/Omrbobbilly" class="btn btn-primary mt-2">Follow Us</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    socialMediaContainer.html(socialMediaHtml);

    // Add custom CSS for hover effect and padding
    $('<style>')
      .prop('type', 'text/css')
      .html(
        `
            .card {
                transition: all 0.3s ease;
                height: 100%;
                margin-bottom: 15px;
            }
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .card-body {
                padding: 20px;
            }
        `
      )
      .appendTo('head');
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
