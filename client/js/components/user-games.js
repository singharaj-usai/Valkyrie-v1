function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayPlacesPanel(user) {
    const placesHtml = `
      <div class="panel panel-primary">
        <div class="panel-heading">
          <h3 class="panel-title">${escapeHtml(user.username)}'s Places</h3>
        </div>
        <div class="panel-body">
          <div id="user-places-all" class="panel-group">
            <p class="text-center">Loading places...</p>
          </div>
        </div>
      </div>
    `;
  
    $("#user-places-panel").html(placesHtml);
    fetchUserPlaces(user.username);
  }

function fetchUserPlaces(username) {
  const token = localStorage.getItem("token");
  $.ajax({
    url: `/api/games/user/${username}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (places) {
      displayPlaces(places, 'all');
    },
    error: function (xhr, status, error) {
      console.error("Error fetching user places:", error);
      $("#user-places-all").html("<p>Error loading places.</p>");
    },
  });
}

function displayPlaces(places, category) {
    const placesContainer = $(`#user-places-${category}`);
    placesContainer.empty();
  
    if (places.length === 0) {
      const noPlacesHtml = `
      <div class="panel panel-default">
        <div class="panel-body text-center">
          <i class="bi bi-emoji-frown" style="font-size: 48px; color: #999;"></i>
          <h4>No Places Yet</h4>
          <p>You haven't created any places yet. Start building your first game!</p>
          <a href="/upload" class="btn btn-primary">Create Your First Place</a>
        </div>
      </div>
    `;
    placesContainer.html(noPlacesHtml);
    return;
  }
  
    places.forEach((place, index) => {
      const placeHtml = `
        <div class="panel panel-default">
          <div class="panel-heading">
            <h4 class="panel-title">
              <a data-toggle="collapse" data-parent="#user-places-${category}" href="#collapse-${category}-${index}">
                ${escapeHtml(place.title)}
              </a>
            </h4>
          </div>
          <div id="collapse-${category}-${index}" class="panel-collapse collapse ${index === 0 ? 'in' : ''}">
            <div class="panel-body">
              <div class="row">
                <div class="col-xs-12 col-sm-6">
                  <a href="/game?id=${place._id}">
                    <img src="${place.thumbnailUrl || 'placeholder-image.jpg'}" alt="${escapeHtml(place.title)}" class="img-responsive" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
                  </a>
                  <a href="/game?id=${place._id}" class="btn btn-success btn-block" style="margin-top: 10px;">Play</a>
                </div>
                <div class="col-xs-12 col-sm-6">
                  <p><strong>Genre:</strong> ${escapeHtml(place.genre || 'Not specified')}</p>
                  <p><strong>Max Players:</strong> ${place.maxPlayers || 'Not specified'}</p>
                  <p><strong>Last Updated:</strong> ${new Date(place.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div class="row" style="margin-top: 15px;">
                <div class="col-xs-12">
                  <div class="well well-sm">
                    <p>${escapeHtml(place.description)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      placesContainer.append(placeHtml);
    });
  }
  
// Export the main function
window.UserGames = {
  displayPlacesPanel: displayPlacesPanel
};