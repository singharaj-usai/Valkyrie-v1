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
                data: JSON.stringify({ title, section, content }),
                contentType: 'application/json',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                success: function(response) {
                    alert('Post submitted successfully!');
                    window.location.href = '/forum/home';
                },
                error: function(xhr, status, error) {
                    console.error('Error submitting post:', error);
                    if (xhr.status === 401) {
                        alert('You must be logged in to create a post. Please log in and try again.');
                        window.location.href = '/login';
                    } else {
                        alert('Error submitting post. Please try again later.');
                    }
                }
            });
        });
    }

    function loadPost(postId) {
        $.ajax({
            url: `/api/forum/posts/${postId}`,
            method: 'GET',
            success: function(post) {
                displayPost(post);
                loadComments(postId);
            },
            error: function(xhr, status, error) {
                console.error('Error loading post:', error);
                $('#post-container').html('<p class="text-danger">Error loading post. Please try again later.</p>');
            }
        });
    }
    
    function displayPost(post) {
        const postContainer = $('#post-container');
        postContainer.html(`
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                </div>
                <div class="panel-body">
                    <p>${escapeHtml(post.content)}</p>
                    <hr>
                    <small>Posted by ${escapeHtml(post.author.username)} on ${new Date(post.createdAt).toLocaleString()} in ${post.section}</small>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-success vote-button" data-vote="up" data-post-id="${post._id}">
                            <i class="bi bi-hand-thumbs-up"></i> <span class="upvote-count">${post.upvotes}</span>
                        </button>
                        <button class="btn btn-sm btn-danger vote-button" data-vote="down" data-post-id="${post._id}">
                            <i class="bi bi-hand-thumbs-down"></i> <span class="downvote-count">${post.downvotes}</span>
                        </button>
                    </div>
                </div>
            </div>
        `);
    
        $('.vote-button').on('click', function() {
            const voteType = $(this).data('vote');
            const postId = $(this).data('post-id');
            votePost(postId, voteType);
        });
    }
    
    function votePost(postId, voteType) {
        $.ajax({
            url: `/api/forum/posts/${postId}/vote`,
            method: 'POST',
            data: { voteType },
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                $(`.upvote-count`).text(response.upvotes);
                $(`.downvote-count`).text(response.downvotes);
            },
            error: function(xhr, status, error) {
                console.error('Error voting:', error);
                alert('Error voting. Please try again later.');
            }
        });
    }
    
    function loadComments(postId) {
        $.ajax({
            url: `/api/forum/posts/${postId}/comments`,
            method: 'GET',
            success: function(comments) {
                displayComments(comments);
            },
            error: function(xhr, status, error) {
                console.error('Error loading comments:', error);
                $('#comments-container').html('<p class="text-danger">Error loading comments. Please try again later.</p>');
            }
        });
    }
    
    function displayComments(comments) {
        const commentsContainer = $('#comments-container');
        commentsContainer.empty();
    
        if (comments.length === 0) {
            commentsContainer.html('<p>No comments yet. Be the first to comment!</p>');
        } else {
            comments.forEach(comment => {
                commentsContainer.append(`
                    <div class="comment">
                        <p>${escapeHtml(comment.content)}</p>
                        <small>Posted by ${escapeHtml(comment.author.username)} on ${new Date(comment.createdAt).toLocaleString()}</small>
                    </div>
                `);
            });
        }
    
        displayCommentForm();
    }
    
    function displayCommentForm() {
        const commentFormContainer = $('#comment-form-container');
        commentFormContainer.html(`
            <form id="comment-form">
                <div class="form-group">
                    <label for="comment-content">Add a comment:</label>
                    <textarea class="form-control" id="comment-content" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Submit Comment</button>
            </form>
        `);
    
        $('#comment-form').on('submit', function(e) {
            e.preventDefault();
            const content = $('#comment-content').val();
            const postId = new URLSearchParams(window.location.search).get('id');
            submitComment(postId, content);
        });
    }
    
    function submitComment(postId, content) {
        $.ajax({
            url: `/api/forum/posts/${postId}/comments`,
            method: 'POST',
            data: { content },
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                $('#comment-content').val('');
                loadComments(postId);
            },
            error: function(xhr, status, error) {
                console.error('Error submitting comment:', error);
                alert('Error submitting comment. Please try again later.');
            }
        });
    }
    
    // Update the existing code to handle individual post pages
    if (window.location.pathname.startsWith('/forum/post')) {
        const postId = new URLSearchParams(window.location.search).get('id');
        if (postId) {
            loadPost(postId);
        } else {
            $('#post-container').html('<p class="text-danger">Invalid post ID.</p>');
        }
    }

    if (window.location.pathname === '/forum/home') {
        loadForumSections();
        loadRecentPosts();
    } else if (window.location.pathname === '/forum/new/post') {
        initNewPostForm();
    }
});