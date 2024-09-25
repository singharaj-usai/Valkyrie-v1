$(document).ready(function() {
    App.init();
    App.updateAuthUI();

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

function initHomePage() {
    console.log('Initializing home page');
    loadForumSections('all');
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    loadRecentPosts(page);
    
    $('#section-summary').text(forumSections.find(section => section.id === 'all').summary);
}

function initSectionPage() {
    const section = window.location.pathname.split('/').pop();
    console.log('Initializing section page for:', section);
    updateSectionTitle(section);
    loadForumSections(section);
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    loadSectionPosts(section, page);
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