function loadStatistics() {
  const contentArea = $('#content-area');
  contentArea.html(
    '<h2 class="text-primary">Statistics Dashboard</h2><div id="statistics" class="mt-4"></div>'
  );

  $.ajax({
    url: '/api/admin/statistics',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (stats) {
      displayStatistics(stats);
    },
    error: function () {
      contentArea.html(
        '<div class="alert alert-danger" role="alert">Error loading statistics.</div>'
      );
    },
  });
}

function displayStatistics(stats) {
  const statistics = $('#statistics');
  statistics.html(`
        <div class="row">
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        <h3 class="panel-title"><i class="glyphicon glyphicon-user"></i> Total Users</h3>
                    </div>
                    <div class="panel-body">
                        <h2 class="text-center">${stats.totalUsers}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="panel panel-success">
                    <div class="panel-heading">
                        <h3 class="panel-title"><i class="glyphicon glyphicon-gamepad"></i> Total Games</h3>
                    </div>
                    <div class="panel-body">
                        <h2 class="text-center">${stats.totalGames}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="panel panel-info">
                    <div class="panel-heading">
                        <h3 class="panel-title"><i class="glyphicon glyphicon-comment"></i> Total Forum Posts</h3>
                    </div>
                    <div class="panel-body">
                        <h2 class="text-center">${stats.totalForumPosts}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="panel panel-warning">
                    <div class="panel-heading">
                        <h3 class="panel-title"><i class="glyphicon glyphicon-time"></i> Active Users (Last 24h)</h3>
                    </div>
                    <div class="panel-body">
                        <h2 class="text-center">${stats.activeUsers}</h2>
                    </div>
                </div>
            </div>
        </div>
    `);
}
