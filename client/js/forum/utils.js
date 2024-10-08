function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function getSectionName(sectionId) {
    const sectionMap = {
        'announcements': 'Announcements',
        'change-log': 'Change Log',
        'suggestions-and-ideas': 'Suggestions and Ideas',
        'media': 'Media',
        'asset-sharing': 'Asset Sharing',
        'tutorials': 'Tutorials',
        'general': 'General Discussion',
        'game-dev': 'Game Development',
        'support': 'Support',
        'off-topic': 'Off-Topic',
        'rate-my-character': 'Rate My Character',
        'memes': 'Memes'
    };
    return sectionMap[sectionId] || 'Unknown Section';
}

function formatContent(content) {
    return escapeHtml(content).replace(/\n/g, '<br>');
}

let currentPage = 1;
const postsPerPage = 10;

function fetchUserStatus(username) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/user-status/${username}`,
        method: 'GET',
        success: function (response) {
          resolve(response.isOnline);
        },
        error: function (xhr, status, error) {
          console.error('Error fetching user status:', error);
          resolve(false);
        }
      });
    });
  }