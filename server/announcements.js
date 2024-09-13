let currentAnnouncement = {
    message: "Welcome to our site! We have exciting new features coming soon.",
    type: "info",
    active: true
  };
  
  module.exports = {
    getCurrentAnnouncement: () => currentAnnouncement,
    setAnnouncement: (message, type = 'info', active = true) => {
      currentAnnouncement = { message, type, active };
    }
  };