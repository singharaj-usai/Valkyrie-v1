$(document).ready(function () {
  // Initialize Navbar and Authentication UI
  App.init();
  App.updateAuthUI();

  let games = [];
  let gameToDelete = null;

  const deleteModalHtml = `
    <div class="modal fade" id="deleteGameModal" tabindex="-1" role="dialog" aria-labelledby="deleteGameModalLabel">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" id="deleteGameModalLabel">Confirm Deletion</h4>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete the game "<span id="delete-game-title"></span>"? This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete-game">Delete Game</button>
                </div>
            </div>
        </div>
    </div>`;
  $('body').append(deleteModalHtml);

  fetchUserGames();

  function fetchUserGames() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    $.ajax({
      url: `/api/games/user/${userId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (fetchedGames) {
        games = fetchedGames;
        displayUserGames(games);
      },
      error: function (xhr, status, error) {
        showError(
          'Error fetching your games: ' +
            (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error')
        );
      },
    });
  }

  function displayUserGames(games) {
    const placesContainer = $('#places-container');
    placesContainer.empty();

    if (games.length === 0) {
      const noPlacesHtml = `
                <div class="list-group-item text-center">
                    <h4>No Places Yet</h4>
                    <p>You haven't created any places yet. Start building your first game!</p>
                    <a href="/upload" class="btn btn-primary">
                        <i class="bi bi-plus-circle"></i> Create Your First Place
                    </a>
                </div>
            `;
      placesContainer.html(noPlacesHtml);
    } else {
      const tableHtml = `
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Thumbnail</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Genre</th>
                            <th>Max Players</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="games-table-body">
                    </tbody>
                </table>
            `;
      placesContainer.html(tableHtml);

      const tableBody = $('#games-table-body');
      games.forEach((game) => {
        const lastUpdatedInfo =
          game.updatedAt && game.createdAt !== game.updatedAt
            ? new Date(game.updatedAt).toLocaleString()
            : 'N/A';
        const gameRow = `
                <tr>
                    <td>
                        <a href="/game?id=${game._id}">
                            <img src="${game.thumbnailUrl}" alt="${escapeHtml(
          game.title
        )}" class="img-responsive" style="width: 100px; height: auto;">
                        </a>
                    </td>
                    <td>${escapeHtml(game.title)}</td>
                    <td>${escapeHtml(game.description)}</td>
                    <td>${escapeHtml(game.genre || 'Not specified')}</td>
                    <td>${game.maxPlayers || 'Not specified'}</td>
                    <td>${lastUpdatedInfo}</td>
                    <td>
                        <button class="btn btn-primary btn-sm edit-game" data-game-id="${
                          game._id
                        }">Edit</button>
                        <button class="btn btn-danger btn-sm delete-game" data-game-id="${
                          game._id
                        }">Delete</button>
                    </td>
                </tr>
                `;
        tableBody.append(gameRow);
      });
    }

    // Add event listeners for edit buttons
    $('.edit-game').on('click', function () {
      const gameId = $(this).data('game-id');
      openEditModal(gameId);
    });

    // Add event listeners for delete buttons
    $('.delete-game').on('click', function () {
      const gameId = $(this).data('game-id');
      const game = games.find((g) => g._id === gameId);
      if (game) {
        gameToDelete = game;
        $('#delete-game-title').text(game.title);
        $('#deleteGameModal').modal('show');
      }
    });
  }

  // Add this new event listener for the confirm delete button in the modal
  $('#confirm-delete-game').on('click', function () {
    if (gameToDelete) {
      deleteGame(gameToDelete._id);
      $('#deleteGameModal').modal('hide');
    }
  });

  function openEditModal(gameId) {
    const game = games.find((g) => g._id === gameId);
    if (game) {
      $('#edit-game-id').val(game._id);
      $('#edit-title').val(game.title);
      $('#edit-description').val(game.description);
      $(`input[name="edit-genre"][value="${game.genre}"]`).prop(
        'checked',
        true
      );
      $('#edit-max-players').val(game.maxPlayers || '');
      $(`input[name="edit-year"][value="${game.year}"]`).prop('checked', true);
      $('#editGameModal').modal('show');
    }
  }

  function deleteGame(gameId) {
    const token = localStorage.getItem('token');
    if (!token) {
      showError('User is not authenticated.');
      return;
    }

    // console.log(`Sending DELETE request for game ID: ${gameId}`);

    $.ajax({
      url: `/api/games/${gameId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        //    console.log('Game deleted successfully:', response);
        fetchUserGames(); // Refresh the games list
        showSuccess('Game deleted successfully');
      },
      error: function (xhr, status, error) {
        console.error('Error deleting game:', xhr.responseText);
        let errorMessage = 'Error deleting game: ';
        if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage += xhr.responseJSON.error;
        } else {
          errorMessage += 'Unknown error';
        }
        showError(errorMessage);
      },
    });
  }

  $('#save-game-changes').on('click', function () {
    const gameId = $('#edit-game-id').val();
    const title = $('#edit-title').val();
    const description = $('#edit-description').val();
    const genre = $('input[name="edit-genre"]:checked').val();
    const maxPlayers = $('#edit-max-players').val();
    const year = $('input[name="edit-year"]:checked').val();
    const thumbnail = $('#edit-thumbnail')[0].files[0];

    if (!genre) {
      showError('Please select a genre');
      return;
    }

    if (!year) {
      showError('Please select a year');
      return;
    }

    if (!maxPlayers || maxPlayers < 1 || maxPlayers > 12) {
      showError('Please enter a valid number for max players (1-12)');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('genre', genre);
    formData.append('maxPlayers', maxPlayers);
    formData.append('year', year);
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    const token = localStorage.getItem('token');
    $.ajax({
      url: `/api/games/${gameId}`,
      method: 'PUT',
      data: formData,
      contentType: false,
      processData: false,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        $('#editGameModal').modal('hide');
        showSuccess('Game updated successfully');
        setTimeout(() => {
          fetchUserGames(); // Refresh the games list
        }, 1000);

      },
      error: function (xhr, status, error) {
        let errorMessage = 'Error updating game: ';
        if (xhr.responseJSON) {
          errorMessage += xhr.responseJSON.error;
          if (xhr.responseJSON.details) {
            errorMessage += ' - ' + xhr.responseJSON.details;
          }
          if (xhr.responseJSON.stack) {
            console.error('Error stack:', xhr.responseJSON.stack);
          }
        } else {
          errorMessage += 'Unknown error';
        }
        showError(errorMessage);
      },
    });
  });

  function showError(message) {
    console.error(message);
    $('#error-message').text(message).removeClass('hidden');
  }

  function showSuccess(message) {
    $('#success-message')
      .text(message)
      .removeClass('hidden')
      .addClass('alert alert-success');
    setTimeout(() => {
      $('#success-message')
        .addClass('hidden')
        .removeClass('alert alert-success');
    }, 3000);
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
