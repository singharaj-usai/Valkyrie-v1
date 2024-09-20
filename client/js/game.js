$(document).ready(function () {
    // Initialize Navbar and Authentication UI
    App.init();
    App.updateAuthUI();

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    if (gameId) {
        fetchGameDetails(gameId);
    } else {
        showError('Game ID not provided');
    }

    function fetchGameDetails(gameId) {
        $.ajax({
            url: `/api/games/${gameId}`,
            method: 'GET',
            success: function (game) {
                displayGameDetails(game);
            },
            error: function (xhr, status, error) {
                showError('Error fetching game details: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
            }
        });
    }

    function displayGameDetails(game) {
        $('#game-container').html(`
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">${game.title}</h3>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-4">
                            <img id="game-thumbnail" src="${game.thumbnailUrl}" alt="Game Thumbnail" class="img-responsive">
                        </div>
                        <div class="col-md-8">
                            <p id="game-description">${game.description}</p>
                            <p><strong>Created by:</strong> ${game.creator.username}</p>
                            <button id="play-game" class="btn btn-success btn-lg">Play Game</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('#play-game').on('click', function () {
            // Implement game launch logic here
            alert('Game launch functionality to be implemented');
        });
    }

    function showError(message) {
        $('#game-container').html(`<div class="panel panel-danger"><div class="panel-heading"><h3 class="panel-title">Error</h3></div><div class="panel-body">${message}</div></div>`);
    }
});