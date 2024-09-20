$(document).ready(function () {
    // Initialize Navbar and Authentication UI
    App.init();
    App.updateAuthUI();

    fetchGames();

    function fetchGames() {
        $.ajax({
            url: '/api/games',
            method: 'GET',
            success: function (games) {
                displayGames(games);
            },
            error: function (xhr, status, error) {
                showError('Error fetching games: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
            }
        });
    }

    function displayGames(games) {
        const gamesContainer = $('#games-container');
        gamesContainer.empty();

        const panel = $('<div class="panel panel-primary">').appendTo(gamesContainer);
        const panelHeading = $('<div class="panel-heading">').appendTo(panel);
        $('<h3 class="panel-title">').text('Available Games').appendTo(panelHeading);
        const panelBody = $('<div class="panel-body">').appendTo(panel);
        const row = $('<div class="row">').appendTo(panelBody);

        games.forEach(game => {
            const gameElement = `
                <div class="col-md-4 col-sm-6 mb-4">
                    <div class="thumbnail">
                        <a href="/game?id=${game._id}">
                            <img src="${game.thumbnailUrl}" alt="${game.title}" class="img-responsive">
                        </a>
                        <div class="caption">
                            <h3><a href="/game?id=${game._id}">${game.title}</a></h3>
                            <p>Creator: <a href="/user-profile?username=${encodeURIComponent(game.creator.username)}">${game.creator.username}</a></p>
                            
                        </div>
                    </div>
                </div>
            `;
            row.append(gameElement);
        });
    }

    function showError(message) {
        $('#games-container').html(`<div class="panel panel-danger"><div class="panel-heading"><h3 class="panel-title">Error</h3></div><div class="panel-body">${message}</div></div>`);
    }
});