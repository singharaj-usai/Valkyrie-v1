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
        $.ajax({
            url: '/api/games/user',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (fetchedGames) {
                games = fetchedGames;
                displayUserGames(games);
            },
            error: function (xhr, status, error) {
                showError('Error fetching your games: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
            }
        });
    }

    function displayUserGames(games) {
        const placesContainer = $('#places-container');
        placesContainer.empty();
    
        if (games.length === 0) {
            const noPlacesHtml = `
                <div class="col-md-12">
                    <div class="panel panel-primary">
                        <div class="panel-heading">
                            <h3 class="panel-title">My Places</h3>
                        </div>
                        <div class="panel-body text-center">
                            <i class="bi bi-emoji-frown" style="font-size: 64px; color: #999; margin-bottom: 20px;"></i>
                            <h3>No Places Yet</h3>
                            <p class="lead">You haven't created any places yet. Start building your first game!</p>
                            <a href="/upload" class="btn btn-primary btn-lg mt-3">
                                <i class="bi bi-plus-circle"></i> Create Your First Place
                            </a>
                        </div>
                    </div>
                </div>
            `;
            placesContainer.html(noPlacesHtml);
        } else {
            games.forEach(game => {
                const lastUpdatedInfo = game.updatedAt && game.createdAt !== game.updatedAt
                    ? `<p><strong>Last Updated:</strong> ${new Date(game.updatedAt).toLocaleString()}</p>`
                    : '';
        
                const gameElement = `
                  <div class="col-md-4 col-sm-6 mb-4">
                    <div class="panel panel-primary">
                        <div class="panel-heading">
                            <h3 class="panel-title">
                                <a href="/game?id=${game._id}" style="color: white;">${escapeHtml(game.title)}</a>
                            </h3>
                        </div>
                        <div class="panel-body">
                            <div style="position: relative; width: 100%; padding-top: 56.25%;">
                                <img src="${game.thumbnailUrl}" alt="${escapeHtml(game.title)}" class="img-responsive" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <p class="mt-2">${escapeHtml(game.description)}</p>
                            <p><strong>Genre:</strong> ${escapeHtml(game.genre || 'Not specified')}</p>
                            <p><strong>Max Players:</strong> ${game.maxPlayers || 'Not specified'}</p>
                            ${lastUpdatedInfo}
                            <button class="btn btn-primary btn-sm edit-game" data-game-id="${game._id}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-game" data-game-id="${game._id}">Delete</button>
                        </div>
                    </div>
                  </div>
                `;
                placesContainer.append(gameElement);
            });
        }
    
        // Add event listeners for edit buttons
        $('.edit-game').on('click', function() {
            const gameId = $(this).data('game-id');
            openEditModal(gameId);
        });
    
        // Add event listeners for delete buttons
        $('.delete-game').on('click', function() {
            const gameId = $(this).data('game-id');
            const game = games.find(g => g._id === gameId);
            if (game) {
                gameToDelete = game;
                $('#delete-game-title').text(game.title);
                $('#deleteGameModal').modal('show');
            }
        });
    }

       // Add this new event listener for the confirm delete button in the modal
       $('#confirm-delete-game').on('click', function() {
        if (gameToDelete) {
            deleteGame(gameToDelete._id);
            $('#deleteGameModal').modal('hide');
        }
    });

    function openEditModal(gameId) {
        const game = games.find(g => g._id === gameId);
        if (game) {
            $('#edit-game-id').val(game._id);
            $('#edit-title').val(game.title);
            $('#edit-description').val(game.description);
            $(`input[name="edit-genre"][value="${game.genre}"]`).prop('checked', true);
            $('#edit-max-players').val(game.maxPlayers || '');
            $('#editGameModal').modal('show');
        }
    }

    
    function deleteGame(gameId) {
        const token = localStorage.getItem('token');
        if (!token) {
            showError('User is not authenticated.');
            return;
        }

        console.log(`Sending DELETE request for game ID: ${gameId}`);

        $.ajax({
            url: `/api/games/${gameId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                console.log('Game deleted successfully:', response);
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
            }
        });
    }

    $('#save-game-changes').on('click', function() {
        const gameId = $('#edit-game-id').val();
        const title = $('#edit-title').val();
        const description = $('#edit-description').val();
        const genre = $('input[name="edit-genre"]:checked').val();
        const maxPlayers = $('#edit-max-players').val();
        const thumbnail = $('#edit-thumbnail')[0].files[0];
    
        if (!genre) {
            showError('Please select a genre');
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
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                $('#editGameModal').modal('hide');
                fetchUserGames(); // Refresh the games list
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
            }
        });
    });
    
    function showError(message) {
        console.error(message);
        $('#error-message').text(message).removeClass('hidden');
    }

    function showSuccess(message) {
        $('#success-message').text(message).removeClass('hidden').addClass('alert alert-success');
        setTimeout(() => {
            $('#success-message').addClass('hidden').removeClass('alert alert-success');
        }, 3000);
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