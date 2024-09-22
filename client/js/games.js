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
    
        // Add a test badge
        const testBadge = '<span class="badge" style="background-color: #337ab7; font-size: 16px; margin-bottom: 10px;">Test Year Badge</span>';
        gamesContainer.append(testBadge);
    
        const panel = $('<div class="panel panel-primary">').appendTo(gamesContainer);
        const panelHeading = $('<div class="panel-heading">').appendTo(panel);
        $('<h3 class="panel-title">').text('Available Games').appendTo(panelHeading);
        const panelBody = $('<div class="panel-body">').appendTo(panel);
        const row = $('<div class="row">').appendTo(panelBody);
    
        games.forEach(game => {
            console.log('Game object:', JSON.stringify(game, null, 2));
            console.log('Game year:', game.year);
            console.log('Game properties:', Object.keys(game)); // Log all game props
    
            const gameElement = `
                <div class="col-md-4 col-sm-6 mb-4">
                    <div class="thumbnail" style="position: relative;">
                        ${game.year ? `<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #337ab7;">${game.year}</span>` : '<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #d9534f;">No Year</span>'}
                        <a href="/game?id=${game._id}">
                            <div class="embed-responsive embed-responsive-16by9">
                                <img src="${game.thumbnailUrl}" alt="${game.title}" class="embed-responsive-item">
                            </div>
                        </a>
                        <div class="caption">
                            <h3><a href="/game?id=${game._id}">${game.title}</a></h3>
                            <p>Creator: <a href="/user-profile?username=${encodeURIComponent(game.creator.username)}">${game.creator.username}</a></p>
                            <p>Properties: ${Object.keys(game).join(', ')}</p>
                        </div>
                    </div>
                </div>
            `;
            row.append(gameElement);
        });
    
        // Add another test badge at the bottom
        gamesContainer.append(testBadge);
    }

    function showError(message) {
        $('#games-container').html(`<div class="panel panel-danger"><div class="panel-heading"><h3 class="panel-title">Error</h3></div><div class="panel-body">${message}</div></div>`);
    }
});