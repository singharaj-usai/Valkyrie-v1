function loadReplies(postId) {
    $.ajax({
        url: `/api/forum/posts/${postId}/replies`,
        method: 'GET',
        success: function(replies) {
            const repliesContainer = $('#replies-container');
            
            // Fetch post counts for all replies authors
            const authorIds = [...new Set(replies.map(reply => reply.author._id))];
            const postCountPromises = authorIds.map(authorId => 
                $.ajax({
                    url: `/api/forum/user-post-count/${authorId}`,
                    method: 'GET'
                })
            );

            Promise.all(postCountPromises).then(postCounts => {
                const postCountMap = Object.fromEntries(postCounts.map((count, index) => [authorIds[index], count]));
                
                replies.forEach(reply => {
                    reply.author.postCount = postCountMap[reply.author._id];
                });

                repliesContainer.html(displayReplies(replies, postId));
                
                // Add event listeners for reply buttons
                $('.reply-button').on('click', function() {
                    const replyId = $(this).data('reply-id');
                    $(`#reply-form-${replyId}`).toggle();
                });

                $('.submit-reply').on('click', function() {
                    const replyId = $(this).data('reply-id');
                    const content = $(this).siblings('textarea').val();
                    submitReply(postId, content, replyId);
                });
            });
        },
        error: function(xhr, status, error) {
            console.error('Error loading replies:', error);
            $('#replies-container').html('<p class="text-danger">Error loading replies. Please try again later.</p>');
        }
    });
}

function submitReply(postId, content, parentReplyId = null) {
    $.ajax({
        url: `/api/forum/posts/${postId}/replies`,
        method: 'POST',
        data: JSON.stringify({ content, parentReplyId }),
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(response) {
            alert('Reply submitted successfully!');
            window.location.href = `/forum/post?id=${postId}`;
        },
        error: function(xhr, status, error) {
            console.error('Error submitting reply:', error);
            console.error('Server response:', xhr.responseText);
            alert('Error submitting reply. Please try again later.');
        }
    });
}

function displayReplies(replies, postId, parentId = null, level = 0) {
    let html = '';
    replies.forEach(reply => {
        if (reply.parentReply === parentId) {
            html += `
                <div class="panel panel-default" style="margin-left: ${level * 20}px; margin-bottom: 15px;">
                    <div class="panel-heading">
                        <span>
                            <h3 class="panel-title" style="display: inline-block; margin-right: 10px;">Reply:</h3>
                            <small">Posted on ${new Date(reply.createdAt).toLocaleString()}</small>
                        </span>
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-md-2 col-sm-3 text-center">
                                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="64" height="64">
                                <h5><a href="/user-profile?username=${reply.author.username}">${escapeHtml(reply.author.username)}</a></h5>
                                <p id="reply-user-status-${reply.author._id}" class="small">Loading status...</p>
                                <p class="small">Posts: ${reply.author.postCount || 0}</p>
                            </div>
                            <div class="col-md-10 col-sm-9">
                                <p style="white-space: pre-wrap;">${formatContent(reply.content)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="btn btn-sm btn-primary reply-button" data-reply-id="${reply._id}">Reply to Reply</button>
                        <div class="reply-form" id="reply-form-${reply._id}" style="display: none; margin-top: 10px;">
                            <textarea class="form-control" rows="3" style="white-space: pre-wrap;"></textarea>
                            <button class="btn btn-sm btn-success submit-reply" data-reply-id="${reply._id}" style="margin-top: 5px;">Submit Reply</button>
                        </div>
                    </div>
                </div>
                ${displayReplies(replies, postId, reply._id, level + 1)}
            `;
        }
    });
    return html;
}