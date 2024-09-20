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
                            <img id="game-thumbnail" src="${game.thumbnailUrl || ''}" alt="Game Thumbnail" class="img-responsive img-thumbnail">
                            <div class="mt-3">
                                <button id="play-game" class="btn btn-success btn-lg btn-block"><i class="bi bi-play-fill"></i> Play Game</button>
                            </div>
                        </div>
                        <div class="col-md-6">
                           
                            <h3>Game Details</h3>
                            <ul class="list-group">
                                <li class="list-group-item"><strong>Creator:</strong> <a href="/user-profile?username=${encodeURIComponent(game.creator?.username || '')}">${escapeHtml(game.creator?.username || '')}</a></li>
                                <li class="list-group-item"><strong>Created:</strong> ${game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'N/A'}</li>
                                <li class="list-group-item"><strong>Last Updated:</strong> ${game.updatedAt ? new Date(game.updatedAt).toLocaleDateString() : 'N/A'}</li>
                                <li class="list-group-item"><strong>Genre:</strong> ${escapeHtml(game.genre || 'Not specified')}</li>
                                <li class="list-group-item"><strong>Max Players:</strong> ${game.maxPlayers || 'Not specified'}</li>
                            </ul>
                            <hr>
                            <h3>Description</h3>
                            <p id="game-description" class="lead">${escapeHtml(game.description || '')}</p>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-md-12">
                            <h3>Comments</h3>
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