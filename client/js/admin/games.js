function loadGames() {
    const contentArea = $('#content-area');
    contentArea.html('<h2 class="text-primary">Game Management</h2><div id="games-list" class="row"></div>');

    $.ajax({
        url: '/api/admin/games',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(games) {
            displayGames(games);
        },
        error: function() {
            contentArea.html('<div class="alert alert-danger" role="alert">Error loading games.</div>');
        }
    });
}

function displayGames(games) {
    const gamesList = $('#games-list');
    games.forEach(game => {
        gamesList.append(`
            <div class="col-md-4 col-sm-6 mb-4">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        <h3 class="panel-title">${escapeHtml(game.title)}</h3>
                    </div>
                    <div class="panel-body">
                        <img src="${game.thumbnailUrl || '/images/default-game-thumbnail.png'}" alt="${escapeHtml(game.title)} thumbnail" class="img-responsive mb-2" style="width: 100%; height: 150px; object-fit: cover;">
                        <p><strong>Creator:</strong> ${escapeHtml(game.creator.username)}</p>
                        <p><strong>Created:</strong> ${new Date(game.createdAt).toLocaleString()}</p>
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

    $('.delete-game').on('click', function() {
        const gameId = $(this).data('game-id');
        deleteGame(gameId);
    });
}

function deleteGame(gameId) {
    if (confirm('Are you sure you want to delete this game?')) {
        $.ajax({
            url: `/api/admin/games/${gameId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function() {
                showAlert('success', 'Game deleted successfully.');
                loadGames();
            },
            error: function() {
                showAlert('danger', 'Error deleting game. Please try again.');
            }
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