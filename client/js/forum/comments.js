function loadComments(postId) {
    $.ajax({
        url: `/api/forum/posts/${postId}/comments`,
        method: 'GET',
        success: function(comments) {
            const commentsContainer = $('#comments-container');
            
            // Fetch post counts for all comment authors
            const authorIds = [...new Set(comments.map(comment => comment.author._id))];
            const postCountPromises = authorIds.map(authorId => 
                $.ajax({
                    url: `/api/forum/user-post-count/${authorId}`,
                    method: 'GET'
                })
            );

            Promise.all(postCountPromises).then(postCounts => {
                const postCountMap = Object.fromEntries(postCounts.map((count, index) => [authorIds[index], count]));
                
                comments.forEach(comment => {
                    comment.author.postCount = postCountMap[comment.author._id];
                });

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
                <div class="panel panel-default" style="margin-left: ${level * 20}px; margin-bottom: 15px;">
                    <div class="panel-heading">
                        <span>
                            <h3 class="panel-title" style="display: inline-block; margin-right: 10px;">Reply:</h3>
                            <small">Posted on ${new Date(comment.createdAt).toLocaleString()}</small>
                        </span>
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-md-2 col-sm-3 text-center">
                                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="64" height="64">
                                <h5><a href="/user-profile?username=${comment.author.username}">${escapeHtml(comment.author.username)}</a></h5>
                                <p id="comment-user-status-${comment.author._id}" class="small">Loading status...</p>
                                <p class="small">Posts: ${comment.author.postCount || 0}</p>
                            </div>
                            <div class="col-md-10 col-sm-9">
                                <p style="white-space: pre-wrap;">${formatContent(comment.content)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="btn btn-sm btn-primary reply-button" data-comment-id="${comment._id}">Reply to Comment</button>
                        <div class="reply-form" id="reply-form-${comment._id}" style="display: none; margin-top: 10px;">
                            <textarea class="form-control" rows="3" style="white-space: pre-wrap;"></textarea>
                            <button class="btn btn-sm btn-success submit-reply" data-comment-id="${comment._id}" style="margin-top: 5px;">Submit Reply</button>
                        </div>
                    </div>
                </div>
                ${displayComments(comments, postId, comment._id, level + 1)}
            `;
        }
    });
    return html;
}