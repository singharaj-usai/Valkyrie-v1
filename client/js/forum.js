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

    let currentPage = 1;
    const postsPerPage = 10;

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

    function loadRecentPosts(page = 1) {
        $.ajax({
            url: '/api/forum/posts',
            method: 'GET',
            data: { page: page, limit: postsPerPage },
            success: function(response) {
                displayPosts(response.posts);
                displayPagination(response.totalPages, page);
            },
            error: function(xhr, status, error) {
                console.error('Error loading posts:', error);
                $('#recent-posts').html('<p class="text-danger">Error loading posts. Please try again later.</p>');
            }
        });
    }

    function displayPosts(posts) {
        const postsContainer = $('#recent-posts');
        postsContainer.empty();

        if (posts.length === 0) {
            postsContainer.html('<p>No posts found.</p>');
            return;
        }

        posts.forEach(post => {
            postsContainer.append(`
                <div class="panel panel-default forum-post">
                    <div class="panel-heading forum-post-header">
                        <h3 class="panel-title">
                            <a href="/forum/post/${post._id}">${post.title}</a>
                        </h3>
                        <small>Posted by ${post.author.username} on ${new Date(post.createdAt).toLocaleString()} in ${post.section}</small>
                    </div>
                    <div class="panel-body forum-post-body">
                        <p>${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}</p>
                        <a href="/forum/post/${post._id}" class="btn btn-sm btn-primary">Read more</a>
                    </div>
                </div>
            `);
        });
    }

    function displayPagination(totalPages, currentPage) {
        const pagination = $('#pagination');
        pagination.empty();

        if (totalPages <= 1) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (currentPage > 1) {
            pagination.append(`<li><a href="#" data-page="${currentPage - 1}">&laquo;</a></li>`);
        }

        for (let i = startPage; i <= endPage; i++) {
            pagination.append(`<li class="${i === currentPage ? 'active' : ''}"><a href="#" data-page="${i}">${i}</a></li>`);
        }

        if (currentPage < totalPages) {
            pagination.append(`<li><a href="#" data-page="${currentPage + 1}">&raquo;</a></li>`);
        }

        pagination.on('click', 'a', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            loadRecentPosts(page);
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

            $.ajax({
                url: '/api/forum/posts',
                method: 'POST',
                data: { title, section, content },
                success: function(response) {
                    alert('Post submitted successfully!');
                    window.location.href = '/forum/home';
                },
                error: function(xhr, status, error) {
                    console.error('Error submitting post:', error);
                    alert('Error submitting post. Please try again later.');
                }
            });
        });
    }

    if (window.location.pathname === '/forum/home') {
        loadForumSections();
        loadRecentPosts();
    } else if (window.location.pathname === '/forum/new/post') {
        initNewPostForm();
    }
});