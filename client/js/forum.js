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
    
        if (posts.length === 0) {
            postsContainer.html('<p>No posts found.</p>');
            return;
        }
    
        posts.forEach(post => {
            postsContainer.append(`
                <div class="panel panel-default forum-post">
                    <div class="panel-heading forum-post-header">
                        <h3 class="panel-title">
                            <a href="/forum/post?id=${post._id}">${escapeHtml(post.title)}</a>
                        </h3>
                        <small>Posted by ${escapeHtml(post.author.username)} on ${new Date(post.createdAt).toLocaleString()} in ${post.section}</small>
                    </div>
                    <div class="panel-body forum-post-body">
                        <p>${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
                        <a href="/forum/post?id=${post._id}" class="btn btn-sm btn-primary">Read more</a>
                    </div>
                </div>
            `);
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
        const sectionSelect = $('#post-section');
        forumSections.forEach(section => {
            sectionSelect.append(`<option value="${section.id}">${section.name}</option>`);
        });
    
        $('#new-post-form').submit(function(e) {
            e.preventDefault();
            const title = $('#post-title').val();
            const section = $('#post-section').val();
            const content = $('#post-content').val();
    
            $.ajax({
                url: '/api/forum/posts',
                method: 'POST',
                data: JSON.stringify({ title, section, content }),
                contentType: 'application/json',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                success: function(response) {
                    alert('Post submitted successfully!');
                    window.location.href = '/forum/home';
                },
                error: function(xhr, status, error) {
                    console.error('Error submitting post:', error);
                    if (xhr.status === 401) {
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
    
        postContainer.html(`
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(post.title)}</h3>
                    <small>Posted by ${escapeHtml(post.author.username)} on ${new Date(post.createdAt).toLocaleString()} in ${post.section}</small>
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
                </div>
            </div>
        `);
    
        // Add event listeners for voting buttons
        $('.vote-button').on('click', function() {
            const voteType = $(this).data('vote');
            voteOnPost(post._id, voteType);
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
                displayComments(comments);
            },
            error: function(xhr, status, error) {
                console.error('Error loading comments:', error);
                $('#comments-container').html('<p class="text-danger">Error loading comments. Please try again later.</p>');
            }
        });
    }
    
    function displayComments(comments) {
        const commentsContainer = $('#comments-container');
        commentsContainer.empty();
    
        if (!comments || comments.length === 0) {
            commentsContainer.html('<p>No comments yet. Be the first to comment!</p>');
        } else {
            comments.forEach(comment => {
                commentsContainer.append(`
                    <div class="comment">
                        <p>${escapeHtml(comment.content)}</p>
                        <small>Posted by ${escapeHtml(comment.author.username)} on ${new Date(comment.createdAt).toLocaleString()}</small>
                    </div>
                `);
            });
        }
    
        displayCommentForm();
    }
    
    function displayCommentForm() {
        const commentFormContainer = $('#comment-form-container');
        commentFormContainer.html(`
            <form id="comment-form">
                <div class="form-group">
                    <label for="comment-content">Add a comment:</label>
                    <textarea class="form-control" id="comment-content" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Submit Comment</button>
            </form>
        `);
    
        $('#comment-form').on('submit', function(e) {
            e.preventDefault();
            const content = $('#comment-content').val();
            const postId = new URLSearchParams(window.location.search).get('id');
            submitComment(postId, content);
        });
    }
    
    function submitComment(postId, content) {
        $.ajax({
            url: `/api/forum/posts/${postId}/comments`,
            method: 'POST',
            data: { content },
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                $('#comment-content').val('');
                loadComments(postId);
            },
            error: function(xhr, status, error) {
                console.error('Error submitting comment:', error);
                alert('Error submitting comment. Please try again later.');
            }
        });
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
if (window.location.pathname.startsWith('/forum/sections/')) {
    console.log('Initializing section page');
    initSectionPage();
} else if (window.location.pathname.startsWith('/forum/post')) {
    console.log('Loading individual post');
    const postId = new URLSearchParams(window.location.search).get('id');
    if (postId) {
        loadPost(postId);
    } else {
        $('#post-container').html('<p class="text-danger">Invalid post ID.</p>');
    }
} else if (window.location.pathname === '/forum/home') {
    console.log('Loading forum home');
    initHomePage();
} else if (window.location.pathname === '/forum/new/post') {
    console.log('Initializing new post form');
    initNewPostForm();
}
});