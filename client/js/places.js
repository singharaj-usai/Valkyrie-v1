$(document).ready(function () {
    // Initialize Navbar and Authentication UI
    App.init();
    App.updateAuthUI();

    let games = [];

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
    
        games.forEach(game => {
            const lastUpdatedInfo = game.updatedAt && game.createdAt !== game.updatedAt
                ? `<p><strong>Last Updated:</strong> ${new Date(game.updatedAt).toLocaleString()}</p>`
                : '';
    
            const gameElement = `
              <div class="col-md-4 col-sm-6 mb-4">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        <h3 class="panel-title">
                            <a href="/game?id=${game._id}">${escapeHtml(game.title)}</a>
                        </h3>
                    </div>
                    <div class="panel-body">
                        <img src="${game.thumbnailUrl}" alt="${escapeHtml(game.title)}" class="img-responsive">
                        <p class="mt-2">${escapeHtml(game.description)}</p>
                        <p><strong>Genre:</strong> ${escapeHtml(game.genre || 'Not specified')}</p>
                        <p><strong>Max Players:</strong> ${game.maxPlayers || 'Not specified'}</p>
                        ${lastUpdatedInfo}
                        <button class="btn btn-primary btn-sm edit-game" data-game-id="${game._id}">Edit</button>
                    </div>
                </div>
            </div>
            `;
            placesContainer.append(gameElement);
        });
    
        // Add event listeners for edit buttons
        $('.edit-game').on('click', function() {
            const gameId = $(this).data('game-id');
            openEditModal(gameId);
        });
    }

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

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});