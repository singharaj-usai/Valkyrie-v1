function loadGames() {
  const contentArea = $('#content-area');
  contentArea.html(
    '<h2 class="text-primary">Game Management</h2><div id="games-list" class="row"></div>'
  );

  $.ajax({
    url: '/api/admin/games',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (games) {
      displayGames(games);
    },
    error: function () {
      contentArea.html(
        '<div class="alert alert-danger" role="alert">Error loading games.</div>'
      );
    },
  });
}

function displayGames(games) {
  const gamesList = $('#games-list');
  gamesList.empty(); // Clear existing games before appending new ones

  games.forEach((game) => {
    gamesList.append(`
      <div class="col-md-4 col-sm-6 mb-4">
          <div class="panel panel-primary">
            <div class="panel-heading">
              <h3 class="panel-title">${escapeHtml(game.title)}</h3>
                </div>
                  <div class="panel-body">
                    <div style="width: 100%; padding-top: 56.25%; position: relative; overflow: hidden;">
                      <img src="${game.thumbnailUrl || '/images/default-game-thumbnail.png'}" alt="${escapeHtml(game.title)} thumbnail" class="img-responsive" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <p><strong>Creator:</strong> ${escapeHtml(game.creator.username)}</p>
                        <p><strong>Created:</strong> ${new Date(game.createdAt).toLocaleString()}</p>
                        <p><strong>Description:</strong> ${escapeHtml(game.description || 'No description provided.')}</p>
                    </div>
                    <div class="panel-footer">
                        <button class="btn btn-danger btn-block delete-game" data-game-id="${game._id}">
                          <i class="glyphicon glyphicon-trash"></i> Delete Game
                        </button>
                    </div>
                </div>
            </div>
        `);
  });

  $('body').append(`
        <div class="modal fade" id="deleteGameModal" tabindex="-1" role="dialog" aria-labelledby="deleteGameModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="deleteGameModalLabel">Confirm Deletion</h4>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete the game "<span id="delete-game-title"></span>"?</p>
                        <p class="text-danger"><strong>This action cannot be undone.</strong></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmDelete">Delete Game</button>
                    </div>
                </div>
            </div>
        </div>
    `);

  $('.delete-game').on('click', function () {
    const gameId = $(this).data('game-id');
    const game = games.find((g) => g._id === gameId);
    if (game) {
      gameToDelete = game;
      $('#delete-game-title').text(game.title);
      $('#deleteGameModal').modal('show');
    }
  });

  $('#confirmDelete').on('click', function () {
    if (gameToDelete) {
      deleteGame(gameToDelete._id);
      $('#deleteGameModal').modal('hide');
    }
  });
}

function deleteGame(gameId) {
  if (confirm('Are you sure you want to delete this game?')) {
    $.ajax({
      url: `/api/admin/games/${gameId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function () {
        showAlert('success', 'Game deleted successfully.');
        loadGames();
      },
      error: function () {
        showAlert('danger', 'Error deleting game. Please try again.');
      },
    });
  }
}

function showAlert(type, message) {
  const alertDiv = $(`<div class="alert alert-${type} alert-dismissible" role="alert">
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            ${message}
                        </div>`);
  $('#games-list').before(alertDiv);
  setTimeout(() => alertDiv.alert('close'), 5000);
}
