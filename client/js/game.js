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
        const token = localStorage.getItem('token');
        $.ajax({
            url: `/api/games/${gameId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (game) {
                displayGameDetails(game);
            },
            error: function (xhr, status, error) {
                showError('Error fetching game details: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error'));
            }
        });
    }

    function displayGameDetails(game) {
        if (!game) {
            showError('Game details not available');
            return;
        }
    
        $('#game-container').html(`
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h1 class="panel-title">${escapeHtml(game.title || '')}</h1>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="embed-responsive embed-responsive-16by9">
                                <img id="game-thumbnail" src="${game.thumbnailUrl || ''}" alt="Game Thumbnail" class="embed-responsive-item">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h2>${escapeHtml(game.title || '')}</h2>
                            <p>by ${escapeHtml(game.creator?.username || '')}</p>
                            <span class="label label-danger">${game.year || ''}</span>
                            <button id="play-game" class="btn btn-success btn-lg btn-block mt-3">
                                <i class="bi bi-play-fill"></i> Play
                            </button>
                            <div class="mt-3">
                                <div class="row">
                                    <div class="col-xs-6 text-center">
                                        <i class="bi bi-hand-thumbs-up"></i>&nbsp;0
                                    </div>
                                    <div class="col-xs-6 text-center">
                                        <i class="bi bi-hand-thumbs-down"></i>&nbsp;0
                                    </div>
                                </div>
                                <div class="progress" style="height: 5px; margin-top: 10px;">
                                    <div class="progress-bar progress-bar-success" role="progressbar" style="width: 50%"></div>
                                    <div class="progress-bar progress-bar-danger" role="progressbar" style="width: 50%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    
            <ul class="nav nav-tabs nav-justified">
                <li class="active"><a href="#description" data-toggle="tab" class="btn btn-default btn-block">Description</a></li>
                <li><a href="#servers" data-toggle="tab" class="btn btn-default btn-block">Servers</a></li>
                <li><a href="#badges" data-toggle="tab" class="btn btn-default btn-block">Badges</a></li>
            </ul>
            <div class="panel panel-primary">
                <div class="panel-body">
                    <div class="tab-content">
                        <div class="tab-pane fade in active" id="description">
                            <h3>Description</h3>
                            <p>${escapeHtml(game.description || '')}</p>

                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Created</th>
                                        <th>Updated</th>
                                        <th>Genre</th>
                                        <th>Visits</th>
                                        <th>Max Players</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>${game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'N/A'}</td>
                                        <td>${game.updatedAt ? new Date(game.updatedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td>${escapeHtml(game.genre || 'N/A')}</td>
                                        <td>0</td>
                                        <td>${game.maxPlayers || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="tab-pane fade" id="servers">
                            <h3>Servers</h3>
                            <p>Server information will be displayed here.</p>
                            <!-- Add server display logic here -->
                        </div>
                        <div class="tab-pane fade" id="badges">
                            <h3>Badges</h3>
                            <p>Badges information will be displayed here.</p>
                            <!-- Add Badges display logic here -->
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">Comments</h3>
                </div>
                <div class="panel-body">
                    <div id="comments-section">
                        <!-- Comments will be dynamically loaded here -->
                        <p class="text-muted">No comments yet. Be the first to comment!</p>
                    </div>
                    <form id="comment-form" class="mt-3">
                        <div class="form-group">
                            <textarea class="form-control" rows="3" placeholder="Leave a comment..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Submit Comment</button>
                    </form>
                </div>
            </div>

               
            
        `);
    
        $('#play-game').on('click', function () {
            // Implement game launch logic here
            alert('Game launch functionality to be implemented');
        });
    
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showError(message) {
        $('#game-container').html(`<div class="panel panel-danger"><div class="panel-heading"><h3 class="panel-title">Error</h3></div><div class="panel-body">${message}</div></div>`);
    }
});