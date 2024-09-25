function loadComments(postId) {
    $.ajax({
        url: `/api/forum/posts/${postId}/comments`,
        method: 'GET',
        success: function(comments) {
            const commentsContainer = $('#comments-container');
            commentsContainer.html(displayComments(comments, postId));
            
            // Add event listeners for reply buttons
            $('.reply-button').on('click', function() {
                const commentId = $(this).data('comment-id');
                $(`#reply-form-${commentId}`).toggle();
            });

            $('.submit-reply').on('click', function() {
                const commentId = $(this).data('comment-id');
                const content = $(this).siblings('textarea').val();
                submitComment(postId, content, commentId);
            });
        },
        error: function(xhr, status, error) {
            console.error('Error loading comments:', error);
            $('#comments-container').html('<p class="text-danger">Error loading comments. Please try again later.</p>');
        }
    });
}

function submitComment(postId, content, parentCommentId = null) {
    $.ajax({
        url: `/api/forum/posts/${postId}/comments`,
        method: 'POST',
        data: JSON.stringify({ content, parentCommentId }),
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(response) {
            alert('Reply submitted successfully!');
            window.location.href = `/forum/post?id=${postId}`;
        },
        error: function(xhr, status, error) {
            console.error('Error submitting comment:', error);
            console.error('Server response:', xhr.responseText);
            alert('Error submitting comment. Please try again later.');
        }
    });
}

function displayComments(comments, postId, parentId = null, level = 0) {
    let html = '';
    comments.forEach(comment => {
        if (comment.parentComment === parentId) {
            html += `
                <div class="panel panel-primary" style="margin-left: ${level * 20}px; margin-bottom: 15px;">
                    <div class="panel-heading">
                        <h4 class="panel-title">
                            <small>Posted by <a href="/user-profile?username=${comment.author.username}">${escapeHtml(comment.author.username)}</a> on ${new Date(comment.createdAt).toLocaleString()}</small>
                        </h4>
                    </div>
                    <div class="panel-body">
                        <p style="white-space: pre-wrap;">${formatContent(comment.content)}</p>
                    </div>
                    <div class="panel-footer">
                        <button class="btn btn-xs btn-primary reply-button" data-comment-id="${comment._id}">Reply</button>
                        <div class="reply-form" id="reply-form-${comment._id}" style="display: none; margin-top: 10px;">
                            <textarea class="form-control" rows="3" style="white-space: pre-wrap;"></textarea>
                            <button class="btn btn-xs btn-success submit-reply" data-comment-id="${comment._id}" style="margin-top: 5px;">Submit Reply</button>
                        </div>
                    </div>
                </div>
                ${displayComments(comments, postId, comment._id, level + 1)}
            `;
        }
    });
    return html;
}