function loadForumPosts() {
    const contentArea = $('#content-area');
    contentArea.html('<h2 class="text-primary">Forum Posts and Replies</h2><div id="forum-posts-list" class="mt-4"></div>');

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
            <div class="panel panel-primary mb-4">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-9">
                            <p class="lead">${escapeHtml(post.content ? post.content.substring(0, 200) : '')}...</p>
                        </div>
                        <div class="col-md-3">
                            <ul class="list-group">
                                <li class="list-group-item"><strong>Author:</strong> ${escapeHtml(post.author.username)}</li>
                                <li class="list-group-item"><strong>Section:</strong> ${sectionName}</li>
                                <li class="list-group-item"><strong>Created:</strong> ${new Date(post.createdAt).toLocaleString()}</li>
                            </ul>
                            <button class="btn btn-sm btn-warning toggle-pin" data-post-id="${post._id}">
                                <i class="fa ${post.isPinned ? 'fa-unlink' : 'fa-thumbtack'}"></i> ${post.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button class="btn btn-danger btn-block mt-3 delete-post" data-post-id="${post._id}">
                                <i class="glyphicon glyphicon-trash"></i> Delete Post
                            </button>
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
        post.replies.forEach(reply => {
            repliesList.append(`
                <div class="panel panel-info mb-2">
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
                                <button class="btn btn-warning btn-block mt-2 delete-reply" data-reply-id="${reply._id}">
                                    <i class="glyphicon glyphicon-remove"></i> Delete Reply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        });

        postsList.append(postElement);

        $('.toggle-pin').on('click', function() {
            const postId = $(this).data('post-id');
            togglePinPost(postId);
          });

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

function togglePinPost(postId) {
    $.ajax({
      url: `/api/admin/forum-posts/${postId}/toggle-pin`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      success: function(response) {
        showAlert('success', response.message);
        loadForumPosts(); 
      },
      error: function() {
        showAlert('danger', 'Error toggling post pin status. Please try again.');
      }
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
        'change-log': 'Change Log',
        'general': 'General Discussion',
        'report-an-issue': 'Report an Issue',
        'suggestions-and-ideas': 'Suggestions and Ideas',
        'media': 'Media',
        'asset-sharing': 'Asset Sharing',
        'tutorials': 'Tutorials',
        'game-dev': 'Game Development',
        'support': 'Support',
        'off-topic': 'Off-Topic',
        'rate-my-character': 'Rate My Character',
        'memes': 'Memes'
    };
    return sectionMap[sectionId] || 'Unknown Section';
}

function showAlert(type, message) {
    const alertElement = $(`<div class="alert alert-${type} alert-dismissible fade in" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong> ${message}
    </div>`);
    $('#content-area').prepend(alertElement);
    setTimeout(() => alertElement.alert('close'), 5000);
}