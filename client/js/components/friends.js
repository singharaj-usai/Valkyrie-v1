const Friends = {
  fetchFriendsList: function (username, containerId, limit = null) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/friends/${username}${limit ? `?limit=${limit}` : ''}`,
        method: 'GET',
        success: function (friends) {
          // Fetch status for all friends
          Promise.all(
            friends.map((friend) => this.getFriendStatus(friend.username))
          )
            .then((statuses) => {
              // Combine firend data with status
              const friendsWithStatus = friends.map((friend, index) => ({
                ...friend,
                isOnline: statuses[index].isOnline,
              }));

              // Sort friends by online status
              friendsWithStatus.sort((a, b) => b.isOnline - a.isOnline);

              const friendsList = $(`#${containerId}`);
              let html = `
                    <div class="panel panel-primary">
                      <div class="panel-heading">
                        <h3 class="panel-title">Friends</h3>
                      </div>
                      <div class="panel-body">
                  `;

              if (friendsWithStatus.length === 0) {
                html += '<p>No friends yet.</p>';
              } else {
                html += '<div class="row" id="friendsContainer">';
                friendsWithStatus.slice(0, 6).forEach((friend, index) => {
                  html += `
                        <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 text-center mb-3 friend-item ${index >= 6 ? 'hidden-xs hidden-sm' : ''}">
                          <a href="/user-profile?username=${encodeURIComponent(friend.username)}" title="${this.escapeHtml(friend.username)}">
                            <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="${this.escapeHtml(friend.username)}" class="img-circle" style="width: 100px; height: 100px; background-color: #f5f5f5;">
                          </a>
                          <p class="mt-2">
                            <a href="/user-profile?username=${encodeURIComponent(friend.username)}" title="${this.escapeHtml(friend.username)}">
                              <span class="friend-status ${friend.isOnline ? 'text-success' : 'text-danger'}">
                                <i class="bi bi-circle-fill"></i>
                              </span>
                              ${this.escapeHtml(friend.username)}
                            </a>
                          </p>
                        </div>
                      `;
                });
                html += '</div>';

                if (friends.length > limit) {
                  html += `
                    <div class="text-center mt-3">
                      <a href="/friends/showfriends?username=${encodeURIComponent(username)}" class="btn btn-primary">
                        Show All Friends
                      </a>
                    </div>
                      `;
                }
              }

              html += `
                      </div>
                    </div>
                  `;

              friendsList.html(html);

              // Add event listener for "Show More" button
              $('#showMoreFriends').on('click', function () {
                $('.friend-item').removeClass('d-none');
                $(this).hide();
              });

              resolve(friendsWithStatus);
            })
            .catch((error) => {
              console.error('Error fetching friend statuses:', error);
              $(`#${containerId}`).html('<p>Error loading friends list.</p>');
              reject(error);
            });
        }.bind(this),
        error: function (xhr, status, error) {
          console.error('Error fetching friends list:', error);
          $(`#${containerId}`).html('<p>Error loading friends list.</p>');
          reject(error);
        },
      });
    });
  },

  getFriendStatus: function (username) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/user-status/${username}`,
        method: 'GET',
        success: function (response) {
          resolve(response);
        },
        error: function (xhr, status, error) {
          console.error(`Error fetching status for ${username}:`, error);
          reject(error);
        },
      });
    });
  },

  escapeHtml: function (unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};
