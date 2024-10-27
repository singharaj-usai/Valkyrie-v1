function displaySearchResults(users) {
  if (users.length === 0) {
    $('#user-search-results').html('<p>No users found.</p>');
    return;
  }

  let html = `
    <div class="panel panel-primary">
      <div class="panel-heading">
        <h3 class="panel-title">Search Results</h3>
      </div>
      <div class="panel-body">
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Username</th>
                <th>Blurb</th>
                <th>Last Logged In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

  const fetchStatusPromises = users.map((user) =>
    fetchUserStatus(user.username)
  );

  Promise.all(fetchStatusPromises).then((statuses) => {
    users.forEach((user, index) => {
      const onlineStatus = statuses[index]
        ? '<span class="text-success"><i class="bi bi-circle-fill"></i> Online</span>'
        : '<span class="text-danger"><i class="bi bi-circle-fill"></i> Offline</span>';
      html += `<tr>
          <td><a href="/user-profile?username=${encodeURIComponent(
            user.username
          )}"><img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="50" height="50" style="width: 64px; height: 64px; background-color: #f5f5f5;"></a></td>
          <td><a href="/user-profile?username=${encodeURIComponent(
            user.username
          )}">${escapeHtml(user.username)}</a></td>
          <td>${
            user.blurb
              ? escapeHtml(
                  user.blurb.substring(0, 50) +
                    (user.blurb.length > 50 ? '...' : '')
                )
              : 'No blurb'
          }</td>
          <td>${
            user.lastLoggedIn
              ? new Date(user.lastLoggedIn).toLocaleString()
              : 'Never'
          }</td>
          <td>${onlineStatus}</td>
        </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `;
    $('#user-search-results').html(html);
  });
}
