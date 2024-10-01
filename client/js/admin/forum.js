function loadForumPosts() {
    const contentArea = $('#content-area');
    contentArea.html('<h2 class="text-primary">Forum Posts and Replies</h2><div id="forum-posts-list"></div>');

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
            contentArea.html('<div class="alert alert-danger" role="alert">Error loading forum posts and replies.</div>');
        }
    });
}

function displayForumPosts(posts) {
    const postsList = $('#forum-posts-list');
    postsList.empty(); // Clear existing posts

    posts.forEach(post => {
        const sectionName = getSectionName(post.section);
        const postElement = $(`
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-9">
                            <p>${escapeHtml(post.content ? post.content.substring(0, 200) : '')}...</p>
                        </div>
                        <div class="col-md-3">
                            <ul class="list-group">
                                <li class="list-group-item"><strong>Author:</strong> ${escapeHtml(post.author.username)}</li>
                                <li class="list-group-item"><strong>Section:</strong> ${sectionName}</li>
                                <li class="list-group-item"><strong>Created:</strong> ${new Date(post.createdAt).toLocaleString()}</li>
                            </ul>
                            <button class="btn btn-danger btn-block delete-post" data-post-id="${post._id}">Delete Post</button>
                        </div>
                    </div>
                </div>
                <div class="panel-footer">
                    <h4 class="text-primary">Replies:</h4>
                    <div class="replies-list"></div>
                </div>
            </div>
        `);

        const repliesList = postElement.find('.replies-list');
        post.comments.forEach(reply => {
            repliesList.append(`
                <div class="panel panel-info">
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-md-9">
                                <p>${escapeHtml(reply.content ? reply.content.substring(0, 100) : '')}...</p>
                            </div>
                            <div class="col-md-3">
                                <ul class="list-group">
                                    <li class="list-group-item"><strong>Author:</strong> ${escapeHtml(reply.author.username)}</li>
                                    <li class="list-group-item"><strong>Created:</strong> ${new Date(reply.createdAt).toLocaleString()}</li>
                                </ul>
                                <button class="btn btn-danger btn-block delete-reply" data-reply-id="${reply._id}">Delete Reply</button>
                            </div>
                        </div>
                    </div>
                </div>
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
//                console.log('Delete post response:', response);
                showAlert('success', 'Post deleted successfully.');
                loadForumPosts();
            },
            error: function(xhr, status, error) {
                console.error('Error deleting post:', error);
                console.error('Server response:', xhr.responseText);
                let errorMessage = 'Error deleting post. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.details) {
                    errorMessage += ' Details: ' + xhr.responseJSON.details;
                }
                showAlert('danger', errorMessage);
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
           //     console.log('Delete reply response:', response);
                showAlert('success', 'Reply deleted successfully.');
                loadForumPosts();
            },
            error: function(xhr, status, error) {
                console.error('Error deleting reply:', error);
                console.error('Server response:', xhr.responseText);
                showAlert('danger', 'Error deleting reply. Please try again.');
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

function showAlert(type, message) {
    const alertElement = $(`<div class="alert alert-${type} alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        ${message}
    </div>`);
    $('#content-area').prepend(alertElement);
    setTimeout(() => alertElement.alert('close'), 5000);
}