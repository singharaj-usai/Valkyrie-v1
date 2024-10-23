const GameAPI = {
  fetchGameDetails: function (gameId) {
    const token = localStorage.getItem('token');
    
    if (!gameId) {
      GameUtils.showError('Invalid game ID');
      return;
    }

    $.ajax({
      url: `/api/games/${gameId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: function (game) {
        if (game) {
          GameDisplay.displayGameDetails(game);
        } else {
          GameUtils.showError('Game not found');
        }
      },
      error: function (xhr, status, error) {
        let errorMessage = 'Error fetching game details';
        if (xhr.status === 404) {
          errorMessage = 'Game not found';
        } else if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage += ': ' + xhr.responseJSON.error;
        }
        GameUtils.showError(errorMessage);
      }
    });
  }
};