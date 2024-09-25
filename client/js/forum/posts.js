function loadRecentPosts(page = 1) {
    $.ajax({
        url: '/api/forum/posts',
        method: 'GET',
        data: { page: page, limit: postsPerPage },
        success: function(response) {
            displayPosts(response.posts);
            displayPagination(response.total, page, 'home');
        },
        error: function(xhr, status, error) {
            console.error('Error loading posts:', error);
            $('#recent-posts').html('<p class="text-danger">Error loading posts. Please try again later.</p>');
        }
    });
}

function loadPost(postId) {
    $.ajax({
        url: `/api/forum/posts/id/${postId}`,
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
    const breadcrumb = $('#post-breadcrumb');
    breadcrumb.html(`
        <li><a href="/forum/home">Forum Home</a></li>
        <li><a href="/forum/sections/${post.section}">${getSectionName(post.section)}</a></li>
        <li class="active">${escapeHtml(post.title)}</li>
    `);

    postContainer.html(`
        <div class="panel panel-info">
            <div class="panel-heading">
                <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                <small>Posted by <a href="/user-profile?username=${post.author.username}">${escapeHtml(post.author.username)}</a> on ${new Date(post.createdAt).toLocaleString()}</small>
            </div>
            <div class="panel-body">
                <p style="white-space: pre-wrap;">${formatContent(post.content)}</p>
            </div>
            <div class="panel-footer">
                <button class="btn btn-sm btn-success vote-button" data-vote="up">
                    <i class="bi bi-hand-thumbs-up"></i> Upvote
                    <span class="upvote-count">${post.upvotes ? post.upvotes.length : 0}</span>
                </button>
                <button class="btn btn-sm btn-danger vote-button" data-vote="down">
                    <i class="bi bi-hand-thumbs-down"></i> Downvote
                    <span class="downvote-count">${post.downvotes ? post.downvotes.length : 0}</span>
                </button>
                <a href="/forum/new/reply?id=${post._id}" class="btn btn-sm btn-primary">Reply to Post</a>
            </div>
        </div>
    `);

    // Add event listeners for voting buttons
    $('.vote-button').on('click', function() {
        const voteType = $(this).data('vote');
        voteOnPost(post._id, voteType);
    });

    // Load comments
    loadComments(post._id);
}

function loadPostForReply(postId) {
    $.ajax({
        url: `/api/forum/posts/id/${postId}`,
        method: 'GET',
        success: function(post) {
            displayPostForReply(post);
            updateBreadcrumbs(post);
        },
        error: function(xhr, status, error) {
            console.error('Error loading post:', error);
            $('#original-post').html('<p class="text-danger">Error loading post. Please try again later.</p>');
        }
    });
}

function displayPostForReply(post) {
    const postContainer = $('#original-post');
    postContainer.html(`
        <h4>${escapeHtml(post.title)}</h4>
        <p>${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
        <small>Posted by  <a href="/user-profile?username=${post.author.username}">${escapeHtml(post.author.username)}</a> on ${new Date(post.createdAt).toLocaleString()}</small>
        `);
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