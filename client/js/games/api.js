const GamesAPI = {
  fetchGames: function () {
    $.ajax({
      url: '/api/games',
      method: 'GET',
      success: function (games) {
        GamesDisplay.displayGames(games);
      },
      error: function (xhr, status, error) {
        GamesUtils.showError(
          'Error fetching games: ' +
            (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error')
        );
      },
    });
  },
};
