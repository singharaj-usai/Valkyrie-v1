// Main application object
const App = {
  // Configuration
  config: {
    apiUrl: "/api/data",
    dataContainerId: "data-container",
    authContainerId: "auth-container",
  },

  // Initialize the application
  init: function () {
    $(document).ready(() => {
        this.checkAuth();


    });
  },

 // Check authentication status
 checkAuth: function () {
    const username = localStorage.getItem("username");
    const currentPath = window.location.pathname;
    if (username) {
      if (currentPath === '/login.html' || currentPath === '/signup.html') {
        window.location.href = '/';
      } else {
        $('#loading').hide();
        $('#content').show();
        this.fetchData();
        this.updateAuthUI();
        this.updateDataContainer();
      }
    } else {
      if (currentPath !== '/login.html' && currentPath !== '/signup.html') {
        window.location.href = '/login.html';
      } else {
        $('#loading').hide();
        $('#content').show();
      }
    }
  },
    

  // Fetch data from the API
  fetchData: function () {
    $.ajax({
      url: this.config.apiUrl,
      method: "GET",
      success: this.handleDataSuccess.bind(this),
      error: this.handleDataError,
    });
  },

  // Handle successful data fetch
  handleDataSuccess: function (data) {
    const html = this.generateHtml(data);
    this.renderHtml(html);
  },

  // Generate HTML from data
  generateHtml: function (data) {
    let html = "<ul>";
    data.forEach((item) => {
      html += `<li>${this.escapeHtml(item.name)}</li>`;
    });
    html += "</ul>";
    return html;
  },

  // Render HTML to the DOM
  renderHtml: function (html) {
    $(`#${this.config.dataContainerId}`).html(html);
  },



  // Escape HTML to prevent XSS
  escapeHtml: function (unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Update authentication UI
  updateAuthUI: function () {
    // Simulating authentication status (replace with actual auth check)
    const username = localStorage.getItem("username");
    let authHtml = "";
    if (username) {
      authHtml = `
                <span class="navbar-text me-3">Welcome, ${this.escapeHtml(
                  username
                )}</span>
                <button class="btn btn-outline-primary" onclick="App.logout()">Logout</button>
            `;
    } else {
      authHtml = `
                <a href="/login.html" class="btn btn-outline-primary me-2">Login</a>
                <a href="/signup.html" class="btn btn-primary">Sign Up</a>
            `;
    }

    $(`#${this.config.authContainerId}`).html(authHtml);
  },
  // Update data container
  updateDataContainer: function () {
    const username = localStorage.getItem("username");
    let dataHtml = "";
    if (username) {
      dataHtml = `<p>Welcome, ${this.escapeHtml(username)}!</p>`;
    } else {
      dataHtml = "<p>Please log in to see your data.</p>";
    }

    $(`#${this.config.dataContainerId}`).html(dataHtml);
  },

  // Logout function (to be implemented)
  logout: function () {
    $.ajax({
      url: "/api/logout",
      method: "POST",
      success: function () {
        localStorage.removeItem("username");
        App.updateAuthUI();
        App.updateDataContainer();

        window.location.href = "/login.html"; // Redirect to login page after logout
      },
      error: function (xhr, status, error) {
        console.error("Error logging out:", error);
      },
    });
  },
};

// Initialize the application
App.init();
