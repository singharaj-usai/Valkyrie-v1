$(document).ready(function() {
    checkUserBan();

    // Check if the user is authenticated and has admin privileges
    checkAdminAuth();

    // Handle sidebar navigation
    $('.nav-sidebar a').on('click', function(e) {
        e.preventDefault();
        $('.nav-sidebar li').removeClass('active');
        $(this).parent().addClass('active');
        loadSection($(this).data('section'));
    });

    // Handle logout
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        logout();
    });
});

function loadSection(section) {
    const contentArea = $('#content-area');
    contentArea.empty();

    switch (section) {
        case 'overview':
            loadOverview();
            break;
        case 'forum-posts':
            loadForumPosts();
            break;
        case 'users':
            loadUsers();
            break;
        case 'games':
            loadGames();
            break;
        case 'statistics':
            loadStatistics();
            break;
    }
}

function loadOverview() {
    const contentArea = $('#content-area');
    contentArea.html(`
        <div class="panel panel-primary">
            <div class="panel-heading">
                <h3 class="panel-title">Welcome to the Admin Dashboard</h3>
            </div>
            <div class="panel-body">
                <p>Select a section from the sidebar to manage different aspects of the website.</p>
                <div class="row">
                    <div class="col-md-4">
                        <div class="panel panel-info">
                            <div class="panel-heading">
                                <h4 class="panel-title">Forum Posts</h4>
                            </div>
                            <div class="panel-body">
                                <p>Manage and moderate forum discussions.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-success">
                            <div class="panel-heading">
                                <h4 class="panel-title">Users</h4>
                            </div>
                            <div class="panel-body">
                                <p>View and manage user accounts.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-warning">
                            <div class="panel-heading">
                                <h4 class="panel-title">Games</h4>
                            </div>
                            <div class="panel-body">
                                <p>Oversee and manage game listings.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}