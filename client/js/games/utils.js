const GamesUtils = {
  showError: function (message) {
    $('#games-container').html(
      `<div class="panel panel-danger"><div class="panel-heading"><h3 class="panel-title">Error</h3></div><div class="panel-body">${message}</div></div>`
    );
  },
};
