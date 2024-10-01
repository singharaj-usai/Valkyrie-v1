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
                <p class="lead">Select a section from the sidebar or click on a panel below to manage different aspects of the website.</p>
                <div class="row">
                    <div class="col-md-4">
                        <div class="panel panel-info clickable-panel" data-section="forum-posts">
                            <div class="panel-heading">
                                <h4 class="panel-title"><i class="fa fa-comments"></i> Forum Posts</h4>
                            </div>
                            <div class="panel-body">
                                <p>Manage and moderate forum discussions.</p>
                                <button class="btn btn-info btn-block">
                                    <span class="underline">Go to Forum Posts</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-success clickable-panel" data-section="users">
                            <div class="panel-heading">
                                <h4 class="panel-title"><i class="fa fa-users"></i> Users</h4>
                            </div>
                            <div class="panel-body">
                                <p>View and manage user accounts.</p>
                                <button class="btn btn-success btn-block">
                                    <span class="underline">Go to Users</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-warning clickable-panel" data-section="games">
                            <div class="panel-heading">
                                <h4 class="panel-title"><i class="fa fa-gamepad"></i> Games</h4>
                            </div>
                            <div class="panel-body">
                                <p>Oversee and manage game listings.</p>
                                <button class="btn btn-warning btn-block">
                                    <span class="underline">Go to Games</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

    // Add click event listeners to the panels
    $('.clickable-panel').on('click', function() {
        const section = $(this).data('section');
        $('.nav-sidebar li').removeClass('active');
        $(`.nav-sidebar a[data-section="${section}"]`).parent().addClass('active');
        loadSection(section);
    });

    // Add custom CSS for underline
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .underline {
                text-decoration: underline;
            }
        `)
        .appendTo('head');
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}