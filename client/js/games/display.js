const GamesDisplay = {
    displayGames: function(games) {
        const gamesContainer = $('#games-container');
        gamesContainer.empty();
    
        const panel = $('<div class="panel panel-primary">').appendTo(gamesContainer);
        const panelHeading = $('<div class="panel-heading">').appendTo(panel);
        $('<h3 class="panel-title">').text('Available Games').appendTo(panelHeading);
        const panelBody = $('<div class="panel-body">').appendTo(panel);
        const row = $('<div class="row">').appendTo(panelBody);
    
        games.forEach(game => {
            const gameElement = this.createGameElement(game);
            row.append(gameElement);
        });
    },

    createGameElement: function(game) {
       // console.log('Game thumbnailUrl:', game.thumbnailUrl);
        return `
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="thumbnail" style="position: relative;">
                    ${game.year ? `<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #337ab7;">${game.year}</span>` : '<span class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 1; background-color: #d9534f;">No Year</span>'}
                    <a href="/game?id=${game._id}">
                        <div class="embed-responsive embed-responsive-16by9">
                            <img src="${game.thumbnailUrl}" alt="${game.title}" class="embed-responsive-item">
                        </div>
                    </a>
                    <div class="caption">
                        <h4><a href="/game?id=${game._id}">${game.title}</a></h4>
                        <p>Creator: <a href="/user-profile?username=${encodeURIComponent(game.creator.username)}">${game.creator.username}</a></p>
                    </div>
                </div>
            </div>
        `;
    }
};