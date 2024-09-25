function loadStatistics() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Statistics</h2><div id="statistics"></div>');

    $.ajax({
        url: '/api/admin/statistics',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(stats) {
            displayStatistics(stats);
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading statistics.</p>');
        }
    });
}

function displayStatistics(stats) {
    const statistics = $('#statistics');
    statistics.html(`
        <div class="row">
            <div class="col-md-3">
                <div class="panel panel-primary">
                    <div class="panel-heading">Total Users</div>
                    <div class="panel-body">
                        <h3>${stats.totalUsers}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="panel panel-success">
                    <div class="panel-heading">Total Games</div>
                    <div class="panel-body">
                        <h3>${stats.totalGames}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="panel panel-info">
                    <div class="panel-heading">Total Forum Posts</div>
                    <div class="panel-body">
                        <h3>${stats.totalForumPosts}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="panel panel-warning">
                    <div class="panel-heading">Active Users (Last 24h)</div>
                    <div class="panel-body">
                        <h3>${stats.activeUsers}</h3>
                    </div>
                </div>
            </div>
        </div>
    `);
}