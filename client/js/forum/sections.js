const forumSections = [
  {
    id: 'all',
    name: 'All Posts',
    summary: 'View all posts from all sections of the forum.',
  },
  {
    id: 'announcements',
    name: 'Announcements',
    summary: 'Important updates and announcements from the Valkyrie team.',
  },
  {
    id: 'change-log',
    name: 'Change Log',
    summary: 'View the change log for Valkyrie.',
  },
  {
    id: 'general',
    name: 'General Discussion',
    summary: 'Discuss any topic related to Valkyrie.',
  },
  {
    id: 'suggestions-and-ideas',
    name: 'Suggestions and Ideas',
    summary: 'Share your suggestions and ideas for Valkyrie.',
  },
  {
    id: 'media',
    name: 'Media',
    summary: 'Share your media with the community.',
  },
  {
    id: 'asset-sharing',
    name: 'Asset Sharing',
    summary: 'Share your assets with the community.',
  },
  {
    id: 'tutorials',
    name: 'Tutorials',
    summary: 'Share your tutorials with the community.',
  },
  {
    id: 'game-dev',
    name: 'Game Development',
    summary:
      'Share your game development progress, ask questions, and get feedback.',
  },
  {
    id: 'support',
    name: 'Support',
    summary: 'Get help with any issues youre experiencing with Valkyrie.',
  },
  {
    id: 'off-topic',
    name: 'Off-Topic',
    summary: 'Discuss anything not directly related to Valkyrie.',
  },
  {
    id: 'rate-my-character',
    name: 'Rate My Character',
    summary: 'Rate my character with the community.',
  },
  {
    id: 'memes',
    name: 'Memes',
    summary: 'Share your memes with the community.',
  },
];

function loadForumSections(activeSection = null) {
  $.ajax({
    url: '/api/forum/sections',
    method: 'GET',
    success: function (sections) {
      const sectionsList = $('#forum-sections');
      sectionsList.empty();
      const currentPath = window.location.pathname;

      sectionsList.append(`
                <a href="/forum/home" class="list-group-item ${
                  currentPath === '/forum/home' ? 'active' : ''
                }">
                    <i class="bi bi-grid-3x3-gap-fill"></i> All Sections
                </a>
            `);

      //HEaders
      //  Valkyrie news
      sectionsList.append('<h4 class="list-group-item active">Valkyrie</h4>');
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'announcements'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'change-log'),
        activeSection,
        currentPath
      );

      // General header
      sectionsList.append('<h4 class="list-group-item active">General</h4>');
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'general'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'suggestions-and-ideas'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'media'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'asset-sharing'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'tutorials'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'game-dev'),
        activeSection,
        currentPath
      );

      //  Other
      sectionsList.append('<h4 class="list-group-item active">Other</h4>');
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'support'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'off-topic'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'rate-my-character'),
        activeSection,
        currentPath
      );
      appendSection(
        sectionsList,
        sections.find((s) => s.id === 'memes'),
        activeSection,
        currentPath
      );
    },
    error: function (xhr, status, error) {
      console.error('Error loading forum sections:', error);
    },
  });
}

function appendSection(sectionsList, section, activeSection, currentPath) {
  if (section && section.id !== 'all') {
    const isActive =
      section.id === activeSection ||
      currentPath === `/forum/sections/${section.id}`
        ? 'active'
        : '';
    const iconClass = getSectionIconClass(section.id);
    sectionsList.append(`
            <a href="/forum/sections/${section.id}" class="list-group-item ${isActive}">
                <i class="${iconClass}"></i> ${section.name}
            </a>
        `);
  }
}

function getSectionIconClass(sectionId) {
  const iconMap = {
    announcements: 'bi bi-megaphone-fill',
    'change-log': 'bi bi-list-columns-reverse',
    'suggestions-and-ideas': 'bi bi-lightbulb-fill',
    media: 'bi bi-image',
    general: 'bi bi-chat-dots-fill',
    'asset-sharing': 'bi bi-share-fill',
    tutorials: 'bi bi-book',
    'game-dev': 'bi bi-controller',
    support: 'bi bi-question-circle-fill',
    'off-topic': 'bi bi-chat-left-text-fill',
    'rate-my-character': 'bi bi-star-fill',
    memes: 'bi bi-emoji-smile-fill',
  };
  return iconMap[sectionId] || 'bi bi-circle-fill';
}

function loadSectionPosts(section, page = 1) {
  // console.log('Loading posts for section:', section);
  const apiUrl =
    section === 'all'
      ? '/api/forum/sections'
      : `/api/forum/sections/${section}`;
  $.ajax({
    url: apiUrl,
    method: 'GET',
    data: { page: page, limit: postsPerPage },
    success: function (response) {
      //  console.log('Received posts:', response.posts);
      displayPosts(response.posts, '#section-posts');
      displayPagination(response.totalPages, page, section);
      updateSectionTitle(section);
    },
    error: function (xhr, status, error) {
      console.error('Error loading posts:', error);
      $('#section-posts').html(
        '<p class="text-danger">Error loading posts. Please try again later.</p>'
      );
    },
  });
}

function updateSectionTitle(section) {
  const sectionInfo = forumSections.find((s) => s.id === section) || {
    name: 'Unknown Section',
    summary: '',
  };
  $('#section-title').text(sectionInfo.name);
  $('#section-summary').text(sectionInfo.summary);
}
