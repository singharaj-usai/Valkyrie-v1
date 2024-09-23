$(document).ready(function() {
    App.init();
    App.updateAuthUI();

    const forumSections = [
        { id: 'all', name: 'All Posts', summary: 'View all posts from all sections of the forum.' },
        { id: 'announcements', name: 'Announcements', summary: 'Important updates and announcements from the AlphaBlox team.' },
        { id: 'general', name: 'General Discussion', summary: 'Discuss any topic related to AlphaBlox.' },
        { id: 'game-dev', name: 'Game Development', summary: 'Share your game development progress, ask questions, and get feedback.' },
        { id: 'support', name: 'Support', summary: 'Get help with any issues youre experiencing with AlphaBlox.' },
        { id: 'off-topic', name: 'Off-Topic', summary: 'Discuss anything not directly related to AlphaBlox.' }
    ];

    function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
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

    let currentPage = 1;
    const postsPerPage = 10;

    function loadForumSections() {
        const sectionsList = $('#forum-sections');
        forumSections.forEach(section => {
            sectionsList.append(`
                <a href="/forum/sections/${section.id}" class="list-group-item">
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
                displayPagination(response.totalPages, page, 'home');
            },
            error: function(xhr, status, error) {
                console.error('Error loading posts:', error);
                $('#recent-posts').html('<p class="text-danger">Error loading posts. Please try again later.</p>');
            }
        });
    }

    function displayPosts(posts, containerId = '#recent-posts') {
        const postsContainer = $(containerId);
        postsContainer.empty();
    
        posts.forEach(post => {
            const replyCount = post.replyCount || 0;
            const postElement = $(`
                <div class="panel panel-default forum-post">
                    <div class="panel-heading forum-post-header">
                        <h3 class="panel-title">
                            <a href="/forum/post?id=${post._id}">${escapeHtml(post.title)}</a>
                        </h3>
                        <small>
                            Posted by <a href="/user-profile?username=${post.author.username}">${escapeHtml(post.author.username)}</a> on ${new Date(post.createdAt).toLocaleString()} 
                            in ${getSectionName(post.section)}
                            
                        </small>
                    </div>
                    <div class="panel-body forum-post-body">
                        <p>${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
                    </div>
                    <div class="panel-footer">
                        <a href="/forum/post?id=${post._id}" class="btn btn-xs btn-primary">Read More</a>
                        <span class="badge pull-right">${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</span>
                    </div>
                </div>
            `);
    
            postsContainer.append(postElement);
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
        // Add breadcrumbs
        const breadcrumb = $('#post-breadcrumb');
        breadcrumb.html(`
            <li><a href="/forum/home">Forum Home</a></li>
            <li class="active">Create New Post</li>
        `);
    
        const sectionSelect = $('#post-section');
        forumSections.forEach(section => {
            if (section.id !== 'all') {
                sectionSelect.append(`<option value="${section.id}">${section.name}</option>`);
            }
        });
    
        $('#new-post-form').submit(function(e) {
            e.preventDefault();
            const title = $('#post-title').val().trim();
            const section = $('#post-section').val();
            const content = $('#post-content').val().trim();
    
            // List of bad words
            const badWords = [
                "nlgga", "nigga", "sex", "raping", "tits", "wtf", "vag", "diemauer", "brickopolis", ".com", ".cf", "dicc", "nude",
                "kesner", "nobe", "idiot", "dildo", "cheeks", "anal", "boob", "horny", "tit", "fucking", "gay", "rape",
                "rapist", "incest", "beastiality", "cum", "maggot", "bloxcity", "bullshit", "fuck", "penis", "dick",
                "vagina", "faggot", "fag", "nigger", "asshole", "shit", "bitch", "stfu", "cunt", "pussy", "hump",
                "meatspin", "redtube", "porn", "kys", "xvideos", "hentai", "gangbang", "milf", "whore", "cock",
                "masturbate"
            ];
    
            // Create a regex pattern with word boundaries
            const regex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'i');
    
            if (regex.test(content)) {
                $('#alert-container').html(`
                    <div class="alert alert-danger" role="alert">
                        Your post contains inappropriate language. Please remove the bad words and try again.
                    </div>
                `);
                return;
            } else {
                $('#alert-container').empty();
            }
    
            $.ajax({
                url: '/api/forum/posts',
                method: 'POST',
                data: JSON.stringify({ title, section, content }),
                contentType: 'application/json',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                success: function(response) {
                    $('#alert-container').html(`
                        <div class="alert alert-success" role="alert">
                            Post submitted successfully!
                        </div>
                    `);
                    
                    setTimeout(function() {
                        window.location.href = '/forum/home';
                    }, 3000); // Wait for 3 seconds before redirecting
                },
                error: function(xhr, status, error) {
                    console.error('Error submitting post:', error);
                    if (xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.message) {
                        $('#alert-container').html(`
                            <div class="alert alert-danger" role="alert">
                                ${escapeHtml(xhr.responseJSON.message)}
                            </div>
                        `);
                    } else if (xhr.status === 401) {
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
        postContainer.empty();
    
        // Add breadcrumbs
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
                    <p>${escapeHtml(post.content)}</p>
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

    function initReplyPage() {
        const postId = new URLSearchParams(window.location.search).get('id');
        if (postId) {
            loadPostForReply(postId);
            setupReplyForm(postId);
        } else {
            $('#original-post').html('<p class="text-danger">Invalid post ID.</p>');
        }
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
                            <small>Posted by <a href="/user-profile?username=${post.author.username}">${escapeHtml(post.author.username)}</a> on ${new Date(post.createdAt).toLocaleString()} in ${getSectionName(post.section)}</small>

            `);
    }
    
    function updateBreadcrumbs(post) {
        const breadcrumb = $('#reply-breadcrumb');
        breadcrumb.html(`
            <li><a href="/forum/home">Forum Home</a></li>
            <li><a href="/forum/sections/${post.section}">${getSectionName(post.section)}</a></li>
            <li><a href="/forum/post?id=${post._id}">${escapeHtml(post.title)}</a></li>
            <li class="active">Reply</li>
        `);
    }
    
    function setupReplyForm(postId) {
        $('#reply-form').on('submit', function(e) {
            e.preventDefault();
            const content = $('#reply-content').val();
            submitComment(postId, content);
        });
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
                                <small>Posted by  <a href="/user-profile?username=${comment.author.username}">${escapeHtml(comment.author.username)}</a> on ${new Date(comment.createdAt).toLocaleString()}</small>
                            </h4>
                        </div>
                        <div class="panel-body">
                            <p>${escapeHtml(comment.content)}</p>
                        </div>
                        <div class="panel-footer">
                            <button class="btn btn-xs btn-primary reply-button" data-comment-id="${comment._id}">Reply</button>
                            <div class="reply-form" id="reply-form-${comment._id}" style="display: none; margin-top: 10px;">
                                <textarea class="form-control" rows="3"></textarea>
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
    

    function initHomePage() {
        console.log('Initializing home page');
        loadForumSections('all');
        loadRecentPosts(1);
        
        // Add this line to set the summary for the "All Sections" page
        $('#section-summary').text(forumSections.find(section => section.id === 'all').summary);
    }

    function initSectionPage() {
        const section = window.location.pathname.split('/').pop();
        console.log('Initializing section page for:', section);
        updateSectionTitle(section);
        loadForumSections(section);
        loadSectionPosts(section);
    }

    function loadSectionPosts(section, page = 1) {
        console.log('Loading posts for section:', section);
        const apiUrl = section === 'all' ? '/api/forum/sections' : `/api/forum/sections/${section}`;
        $.ajax({
            url: apiUrl,
            method: 'GET',
            data: { page: page, limit: postsPerPage },
            success: function(response) {
                console.log('Received posts:', response.posts);
                displayPosts(response.posts, '#section-posts');
                displayPagination(response.totalPages, page, section);
                updateSectionTitle(section);
            },
            error: function(xhr, status, error) {
                console.error('Error loading posts:', error);
                $('#section-posts').html('<p class="text-danger">Error loading posts. Please try again later.</p>');
            }
        });
    }
    
    function updateSectionTitle(section) {
        const sectionInfo = forumSections.find(s => s.id === section) || { name: 'Unknown Section', summary: '' };
        $('#section-title').text(sectionInfo.name);
        $('#section-summary').text(sectionInfo.summary);
    }
    
    function displayPagination(totalPages, currentPage, section) {
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
            loadSectionPosts(section, page);
        });
    }
    
    function loadForumSections(activeSection = null) {
        $.ajax({
            url: '/api/forum/sections',
            method: 'GET',
            success: function(sections) {
                const sectionsList = $('#forum-sections');
                sectionsList.empty();
                const currentPath = window.location.pathname;
                
                sectionsList.append(`
                    <a href="/forum/home" class="list-group-item ${currentPath === '/forum/home' ? 'active' : ''}">
                        <i class="bi bi-grid-3x3-gap-fill"></i> All Sections
                    </a>
                `);
                
                sections.forEach(section => {
                    if (section.id !== 'all') {
                        const isActive = (section.id === activeSection) || 
                                         (currentPath === `/forum/sections/${section.id}`) ? 'active' : '';
                        const iconClass = getSectionIconClass(section.id);
                        sectionsList.append(`
                            <a href="/forum/sections/${section.id}" class="list-group-item ${isActive}">
                                <i class="${iconClass}"></i> ${section.name}
                            </a>
                        `);
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading forum sections:', error);
            }
        });
    }
    
    function getSectionIconClass(sectionId) {
        const iconMap = {
            'announcements': 'bi bi-megaphone-fill',
            'general': 'bi bi-chat-dots-fill',
            'game-dev': 'bi bi-controller',
            'support': 'bi bi-question-circle-fill',
            'off-topic': 'bi bi-chat-left-text-fill'
        };
        return iconMap[sectionId] || 'bi bi-circle-fill';
    }

// Update the existing code to handle section pages
if (window.location.pathname === '/forum/home') {
    initHomePage();
} else if (window.location.pathname.startsWith('/forum/sections/')) {
    initSectionPage();
} else if (window.location.pathname === '/forum/new/post') {
    initNewPostForm();
} else if (window.location.pathname === '/forum/post') {
    const postId = new URLSearchParams(window.location.search).get('id');
    if (postId) {
        loadPost(postId);
    } else {
        $('#post-container').html('<p class="text-danger">Invalid post ID.</p>');
    }
} else if (window.location.pathname === '/forum/new/reply') {
    initReplyPage();
}
});