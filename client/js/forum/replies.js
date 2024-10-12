function fetchTop15Posters() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/api/forum/top-15-posters',
      method: 'GET',
      success: function (response) {
        resolve(response.map((user) => user._id));
      },
      error: function (xhr, status, error) {
        console.error('Error fetching top 15 posters:', error);
        reject(error);
      },
    });
  });
}

function loadReplies(postId) {
  $.ajax({
    url: `/api/forum/posts/${postId}/replies`,
    method: 'GET',
    success: function (replies) {
      const repliesContainer = $('#replies-container');
      displayReplies(replies, postId).then((html) => {
        repliesContainer.html(html);

        // Add event listeners for reply buttons
        $('.reply-button').on('click', function () {
          const replyId = $(this).data('reply-id');
          $(`#reply-form-${replyId}`).toggle();
        });

        $('.submit-reply').on('click', function () {
          const replyId = $(this).data('reply-id');
          const content = $(this).siblings('textarea').val();
          submitReply(postId, content, replyId);
        });

        // Load user statuses and post counts
        replies.forEach((reply) => {
          fetchUserStatus(reply.author.username).then((isOnline) => {
            const onlineStatus = isOnline
              ? '<span class="text-success"><i class="bi bi-circle-fill"></i> Online</span>'
              : '<span class="text-danger"><i class="bi bi-circle-fill"></i> Offline</span>';
            $(`#reply-user-status-${reply._id}`).html(onlineStatus);
          });

          fetchForumPostCount(reply.author._id).then((postCount) => {
            $(`#reply-post-count-${reply._id}`).text(postCount);
          });
        });
      });
    },
    error: function (xhr, status, error) {
      console.error('Error loading replies:', error);
      $('#replies-container').html(
        '<p class="text-danger">Error loading replies. Please try again later.</p>'
      );
    },
  });
}

function submitReply(postId, content, parentReplyId = null) {
  $.ajax({
    url: `/api/forum/posts/${postId}/replies`,
    method: 'POST',
    data: JSON.stringify({ content, parentReplyId }),
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (response) {
      alert('Reply submitted successfully!');
      window.location.href = `/forum/post?id=${postId}`;
    },
    error: function (xhr, status, error) {
      console.error('Error submitting reply:', error);
      console.error('Server response:', xhr.responseText);
      alert('Error submitting reply. Please try again later.');
    },
  });
}

function displayReplies(replies, postId) {
  return fetchTop15Posters().then((top15) => {
    function renderReply(reply, level = 0) {
      const isTop15 = top15.includes(reply.author._id);
      const top15Badge = isTop15
        ? '<p class="small text-success"><i class="fa fa-trophy"></i> Top 15 Poster</p>'
        : '';
      let html = `
                <div class="panel panel-default" style="margin-left: ${
                  level * 20
                }px; margin-bottom: 15px;">
                    <div class="panel-heading">
                        <span>
                            <h3 class="panel-title" style="display: inline-block; margin-right: 10px;">Reply:</h3>
                            <small>Posted on ${new Date(
                              reply.createdAt
                            ).toLocaleString()}</small>
                        </span>
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-md-2 col-sm-3 text-center">
                                <p id="reply-user-status-${
                                  reply._id
                                }" class="small">Loading status...</p>
                                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="64" height="64">
                                <h5><a href="/user-profile?username=${
                                  reply.author.username
                                }">${escapeHtml(reply.author.username)}</a></h5>
                                ${top15Badge}
                                <p><b>Join Date:</b> ${formatDate(
                                  reply.author.signupDate
                                )}</p>
                                <p class="small"><b>Posts:</b> <span id="reply-post-count-${
                                  reply._id
                                }">${reply.author.postCount || 0}</span></p>
                            </div>
                            <div class="col-md-10 col-sm-9">
                                <p style="white-space: pre-wrap;">${formatContent(
                                  reply.content
                                )}</p>
                            </div>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <button class="btn btn-sm btn-primary reply-button" data-reply-id="${
                          reply._id
                        }">Reply to Reply</button>
                        <div class="reply-form" id="reply-form-${
                          reply._id
                        }" style="display: none; margin-top: 10px;">
                            <textarea class="form-control" rows="3" style="white-space: pre-wrap;"></textarea>
                            <button class="btn btn-sm btn-success submit-reply" data-reply-id="${
                              reply._id
                            }" style="margin-top: 5px;">Submit Reply</button>
                        </div>
                    </div>
                </div>
            `;

      // Render child replies
      const childReplies = replies.filter((r) => r.parentReply === reply._id);
      childReplies.forEach((childReply) => {
        html += renderReply(childReply, level + 1);
      });

      return html;
    }

    let html = '';
    const topLevelReplies = replies.filter((reply) => !reply.parentReply);
    topLevelReplies.forEach((reply) => {
      html += renderReply(reply);
    });

    return html;
  });
}

// Add this function to fetch the forum post count
function fetchForumPostCount(userId) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `/api/forum/user-post-count/${userId}`,
      method: 'GET',
      success: function (response) {
        resolve(response.count);
      },
      error: function (xhr, status, error) {
        console.error('Error fetching forum post count:', error);
        resolve(0); // Default to 0 if there's an error
      },
    });
  });
}

function formatDate(dateString) {
  if (!dateString) {
    return 'N/A';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
