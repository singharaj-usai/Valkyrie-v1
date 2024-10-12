$(document).ready(function () {
  App.init();
  App.updateAuthUI();

  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get('id');

  if (gameId) {
    GameAPI.fetchGameDetails(gameId);
  } else {
    GameUtils.showError('Game ID not provided');
  }
});
