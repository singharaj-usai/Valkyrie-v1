const forumSections = [
    { id: 'all', name: 'All Posts', summary: 'View all posts from all sections of the forum.' },
    { id: 'announcements', name: 'Announcements', summary: 'Important updates and announcements from the Valkyrie team.' },
    { id: 'general', name: 'General Discussion', summary: 'Discuss any topic related to Valkyrie.' },
    { id: 'game-dev', name: 'Game Development', summary: 'Share your game development progress, ask questions, and get feedback.' },
    { id: 'support', name: 'Support', summary: 'Get help with any issues youre experiencing with Valkyrie.' },
    { id: 'off-topic', name: 'Off-Topic', summary: 'Discuss anything not directly related to Valkyrie.' }
];

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