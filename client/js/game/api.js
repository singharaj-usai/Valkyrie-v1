const GameAPI = {
  fetchGameDetails: function (gameId) {
    const token = localStorage.getItem('token');
    $.ajax({
      url: `/api/games/${gameId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (game) {
        GameDisplay.displayGameDetails(game);
      },
      error: function (xhr, status, error) {
        GameUtils.showError(
          'Error fetching game details: ' +
            (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error')
        );
      },
    });
  },
};
