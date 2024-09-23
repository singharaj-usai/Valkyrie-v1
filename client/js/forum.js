$(document).ready(function() {
    App.init();
    App.updateAuthUI();

    const forumSections = [
        { id: 'announcements', name: 'Announcements' },
        { id: 'general', name: 'General Discussion' },
        { id: 'game-dev', name: 'Game Development' },
        { id: 'support', name: 'Support' },
        { id: 'off-topic', name: 'Off-Topic' }
    ];

    function loadForumSections() {
        const sectionsList = $('#forum-sections');
        forumSections.forEach(section => {
            sectionsList.append(`
                <a href="/forum/section/${section.id}" class="list-group-item">
                    ${section.name}
                </a>
            `);
        });
    }

    function loadRecentPosts() {
        // This function would typically fetch recent posts from the server
        // For now, we'll use dummy data
        const recentPosts = [
            { id: 1, title: 'Welcome to AlphaBlox Forums!', author: 'Admin', date: '2023-05-01', section: 'Announcements' },
            { id: 2, title: 'Tips for New Game Developers', author: 'GameGuru', date: '2023-05-02', section: 'Game Development' },
            { id: 3, title: 'How to Report Bugs', author: 'SupportTeam', date: '2023-05-03', section: 'Support' }
        ];

        const postsContainer = $('#recent-posts');
        recentPosts.forEach(post => {
            postsContainer.append(`
                <div class="panel panel-default forum-post">
                    <div class="panel-heading forum-post-header">
                        <h3 class="panel-title">
                            <a href="/forum/post/${post.id}">${post.title}</a>
                        </h3>
                        <small>Posted by ${post.author} on ${post.date} in ${post.section}</small>
                    </div>
                    <div class="panel-body forum-post-body">
                        <p>Click to read more...</p>
                    </div>
                </div>
            `);
        });
    }

    function initNewPostForm() {
        const sectionSelect = $('#post-section');
        forumSections.forEach(section => {
            sectionSelect.append(`<option value="${section.id}">${section.name}</option>`);
        });

        $('#new-post-form').submit(function(e) {
            e.preventDefault();
            const title = $('#post-title').val();
            const section = $('#post-section').val();
            const content = $('#post-content').val();

            // Here you would typically send this data to your server
            console.log('New post:', { title, section, content });
            alert('Post submitted successfully!');
            window.location.href = '/forum/home';
        });
    }

    if (window.location.pathname === '/forum/home') {
        loadForumSections();
        loadRecentPosts();
    } else if (window.location.pathname === '/forum/new/post') {
        initNewPostForm();
    }
});