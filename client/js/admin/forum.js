function loadForumPosts() {
    const contentArea = $('#content-area');
    contentArea.html('<h2>Forum Posts and Replies</h2><div id="forum-posts-list"></div>');

    $.ajax({
        url: '/api/admin/forum-posts',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(posts) {
            displayForumPosts(posts);
        },
        error: function() {
            contentArea.html('<p class="text-danger">Error loading forum posts and replies.</p>');
        }
    });
}

function displayForumPosts(posts) {
    const postsList = $('#forum-posts-list');
    postsList.empty(); // Clear existing posts

    posts.forEach(post => {
        const sectionName = getSectionName(post.section);
        const postElement = $(`
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                </div>
                <div class="panel-body">
                    <p>${escapeHtml(post.content ? post.content.substring(0, 200) : '')}...</p>
                    <p>Author: ${escapeHtml(post.author.username)}</p>
                    <p>Section: ${sectionName}</p>
                    <p>Created: ${new Date(post.createdAt).toLocaleString()}</p>
                    <button class="btn btn-danger btn-sm delete-post" data-post-id="${post._id}">Delete Post</button>
                </div>
                <div class="panel-footer">
                    <h4>Replies:</h4>
                    <div class="replies-list"></div>
                </div>
            </div>
        `);

        const repliesList = postElement.find('.replies-list');
        post.comments.forEach(reply => {
            repliesList.append(`
                <div class="reply">
                    <p>${escapeHtml(reply.content ? reply.content.substring(0, 100) : '')}...</p>
                    <p>Author: ${escapeHtml(reply.author.username)}</p>
                    <p>Created: ${new Date(reply.createdAt).toLocaleString()}</p>
                    <button class="btn btn-danger btn-xs delete-reply" data-reply-id="${reply._id}">Delete Reply</button>
                </div>
                <hr>
            `);
        });

        postsList.append(postElement);

        // Add event listeners for delete buttons
        postElement.find('.delete-post').on('click', function() {
            const postId = $(this).data('post-id');
            deleteForumPost(postId);
        });

        postElement.find('.delete-reply').on('click', function() {
            const replyId = $(this).data('reply-id');
            deleteForumReply(replyId);
        });
    });
}

function deleteForumPost(postId) {
    if (confirm('Are you sure you want to delete this post and all its replies?')) {
        $.ajax({
            url: `/api/admin/forum-posts/${postId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                console.log('Delete post response:', response);
                alert('Post deleted successfully.');
                loadForumPosts();
            },
            error: function(xhr, status, error) {
                console.error('Error deleting post:', error);
                console.error('Server response:', xhr.responseText);
                let errorMessage = 'Error deleting post. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.details) {
                    errorMessage += ' Details: ' + xhr.responseJSON.details;
                }
                alert(errorMessage);
            }
        });
    }
}

function deleteForumReply(replyId) {
    if (confirm('Are you sure you want to delete this reply?')) {
        $.ajax({
            url: `/api/admin/forum-replies/${replyId}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                console.log('Delete reply response:', response);
                alert('Reply deleted successfully.');
                loadForumPosts();
            },
            error: function(xhr, status, error) {
                console.error('Error deleting reply:', error);
                console.error('Server response:', xhr.responseText);
                alert('Error deleting reply. Please try again.');
            }
        });
    }
}

function getSectionName(sectionId) {
    const sectionMap = {
        'announcements': 'Announcements',
        'general': 'General Discussion',
        'game-dev': 'Game Development',
        'support': 'Support',
        'off-topic': 'Off-Topic'
    };
    return sectionMap[sectionId] || 'Unknown Section';
}