function loadGames() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Games</h2><div id="games-list"></div>');

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
            contentArea.html('<p class="text-danger">Error loading games.</p>');
        }
    });
}

function displayGames(games) {
    const gamesList = $('#games-list');
    games.forEach(game => {
        gamesList.append(`
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(game.title)}</h3>
                </div>
                <div class="panel-body">
                    <p>Creator: ${escapeHtml(game.creator.username)}</p>
                    <p>Created: ${new Date(game.createdAt).toLocaleString()}</p>
                    <button class="btn btn-danger btn-sm delete-game" data-game-id="${game._id}">Delete Game</button>
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
                alert('Game deleted successfully.');
                loadGames();
            },
            error: function() {
                alert('Error deleting game. Please try again.');
            }
        });
    }
}