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
    contentArea.html('<h2>Overview</h2><p>Welcome to the admin dashboard. Select a section from the sidebar to manage different aspects of the website.</p>');
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}