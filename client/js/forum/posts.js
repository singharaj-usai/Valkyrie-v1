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
        url: `/api/forum/posts/${postId}`,
        method: 'GET',
        success: function(post) {
            displayPost(post);
            loadReplies(postId);
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

    const userVote = post.userVote || 'none';

    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const pinUnpinButton = isAdmin ? `
      <button class="btn btn-sm btn-warning toggle-pin" data-post-id="${post._id}">
        <i class="fa ${post.isPinned ? 'fa-unlink' : 'fa-thumbtack'}"></i> ${post.isPinned ? 'Unpin' : 'Pin'}
    </button>
    ` : '';

    postContainer.html(`
        <div id="post-${post._id}" class="panel panel-primary">
            <div class="panel-heading">
                <span>
                    <h3 class="panel-title" style="display: inline-block; margin-right: 10px;">
                    ${post.isPinned ? '<i class="fa fa-thumbtack text-warning" title="Pinned Post"></i> ' : ''}
                    Original Post:
                    </h3>
                    <small>Posted on ${new Date(post.createdAt).toLocaleString()}</small>
                </span>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-md-2 col-sm-3 text-center">
                        <p id="user-status-${post.author._id}" class="small">Loading status...</p>
                        <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="64" height="64">
                        <h5><a href="/user-profile?username=${post.author.username}">${escapeHtml(post.author.username)}</a></h5>
                        <p class="small"><b>Posts:</b> ${post.author.postCount || 0}</p>
                    </div>
                    <div class="col-md-10 col-sm-9">
                        <p style="white-space: pre-wrap;">${formatContent(post.content)}</p>
                    </div>
                </div>
            </div>
            <div class="panel-footer">
                    ${pinUnpinButton}
                <button class="btn btn-sm btn-success vote-button ${userVote === 'up' ? 'active' : ''}" data-vote="up">
                    <i class="bi bi-hand-thumbs-up"></i> Upvote
                    <span class="upvote-count">${post.upvotes || 0}</span>
                </button>
                <button class="btn btn-sm btn-danger vote-button ${userVote === 'down' ? 'active' : ''}" data-vote="down">
                    <i class="bi bi-hand-thumbs-down"></i> Downvote
                    <span class="downvote-count">${post.downvotes || 0}</span>
                </button>
                <a href="/forum/new/reply?id=${post._id}" class="btn btn-sm btn-primary">Reply to Post</a>
            </div>
        </div>
    `);

    // Add event listeners for voting buttons
    $('.vote-button').on('click', function() {
        const voteType = $(this).data('vote');
        votePost(post._id, voteType);
    });

    if (isAdmin) {
        $('.toggle-pin').on('click', function() {
          const postId = $(this).data('post-id');
          togglePinPost(postId);
        });
    }

    // Load user status
    fetchUserStatus(post.author.username).then(isOnline => {
        const onlineStatus = isOnline 
            ? '<span class="text-success"><i class="bi bi-circle-fill"></i> Online</span>' 
            : '<span class="text-danger"><i class="bi bi-circle-fill"></i> Offline</span>';
        $(`#user-status-${post.author._id}`).html(onlineStatus);
    });

    // Load replies
    loadReplies(post._id);
}

function togglePinPost(postId) {
    $.ajax({
      url: `/api/admin/forum-posts/${postId}/toggle-pin`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      success: function(response) {
        alert(response.message);
        loadPost(postId);
      },
      error: function() {
        alert('Error toggling post pin status. Please try again.');
      }
    });
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
        data: JSON.stringify({ voteType }),
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(response) {
            $(`#post-${postId} .upvote-count`).text(response.upvotes);
            $(`#post-${postId} .downvote-count`).text(response.downvotes);
            $(`#post-${postId} .vote-button`).removeClass('active');
            if (response.userVote !== 'none') {
                $(`#post-${postId} .vote-button[data-vote="${response.userVote}"]`).addClass('active');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error voting:', error);
            alert('Error voting. Please try again later.');
        }
    });
}