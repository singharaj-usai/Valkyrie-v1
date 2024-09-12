// Main application object
const App = {
  // Configuration
  config: {
    apiUrl: "/api/data",
    dataContainerId: "data-container",
    authContainerId: "auth-container",
  },

  // Load navbar
  loadNavbar: function () {
    $.get("/navbar.html", function (data) {
      $("#navbar-container").html(data);
      App.updateAuthUI();
    });
  },

  // Initialize the application
  init: function () {
    $(document).ready(() => {
      this.loadNavbar();
      this.checkAuth();
      this.initSearch();
    });
  },

  initSearch: function () {
    $(document).on("submit", ".navbar-form", function (e) {
      e.preventDefault();
      const searchTerm = $("#search-input").val().trim();
      window.location.href = `/search-results.html?q=${encodeURIComponent(searchTerm)}`;
    });
  },

  // Check authentication status
  checkAuth: function () {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const currentPath = window.location.pathname;
  
    if (token && username) {
      $.ajax({
        url: "/api/validate-session",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        success: () => {
          if (currentPath === "/login.html" || currentPath === "/register.html") {
            window.location.href = "/";
          } else {
            $("#loading").hide();
            $("#content").show();
            this.fetchData();
            this.updateAuthUI();
            this.updateDataContainer();
          }
        },
        error: () => {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          if (currentPath !== "/login.html" && currentPath !== "/register.html") {
            window.location.href = "/login.html";
          } else {
            $("#loading").hide();
            $("#content").show();
          }
        }
      });
    } else {
      if (currentPath !== "/login.html" && currentPath !== "/register.html") {
        window.location.href = "/login.html";
      } else {
        $("#loading").hide();
        $("#content").show();
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
    const username = Cookies.get("username");
    const token = localStorage.getItem("token");
    const authContainer = $("#auth-container");
    if (username && token) {
      $.ajax({
        url: "/api/user-info",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        success: (response) => {
          authContainer.html(`
            <li class="dropdown">
              <a href="#" class="dropdown-toggle navbar-text" data-toggle="dropdown" role="button" aria-expanded="false">
                ${this.escapeHtml(username)} <i class="bi bi-coin"></i> <span id="currency-amount">${response.currency}</span> <span class="caret"></span>
              </a>
              <ul class="dropdown-menu" role="menu">
                <li><a href="/user-profile.html">Profile</a></li>
                <li><a href="#" id="claim-currency">Claim Daily</a></li>
                <li class="divider"></li>
                <li><a href="#" id="settings">Settings</a></li>
                <li class="divider"></li>
                <li><a href="#" id="logout">Logout</a></li>
              </ul>
            </li>
          `);
          this.initClaimCurrency();
          this.initLogout();
          $('#user-submenu').show();
        },
        error: (xhr, status, error) => {
          console.error("Error fetching user info:", error);
          this.logout();
        }
      });
    } else {
      authContainer.html(`
        <a href="/login.html" class="btn btn-outline-primary me-2">Login</a>
        <a href="/register.html" class="btn btn-primary">Sign Up</a>
      `);
      $('#user-submenu').hide();
    }
  },

  initClaimCurrency: function () {
    $("#claim-currency").on("click", (e) => {
      e.preventDefault();
      $.ajax({
        url: "/api/claim-daily-currency",
        method: "POST",
        success: (response) => {
          $("#currency-amount").text(response.newBalance);
          this.showAlert("success", "You've claimed your daily currency!");
        },
        error: (xhr, status, error) => {
          this.showAlert("danger", xhr.responseJSON.error || "Error claiming daily currency");
        }
      });
    });
  },

  initLogout: function () {
    $("#logout").on("click", (e) => {
      e.preventDefault();
      this.logout();
    });
  },
  
  logout: function () {
    const token = localStorage.getItem("token");
    $.ajax({
      url: "/api/logout",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      success: () => {
        localStorage.removeItem("username");
        localStorage.removeItem("token");
        window.location.href = "/login.html";
      },
      error: (xhr, status, error) => {
        console.error("Error logging out:", error);
      },
    });
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


};

// Load footer
$.get("/footer.html", function (data) {
  $("body").append(data);
  updateUserCount();
});

function updateUserCount() {
  $.ajax({
    url: "/api/user-count",
    method: "GET",
    success: function (response) {
      $("#user-count").text(response.count);
    },
    error: function (xhr, status, error) {
      console.error("Error fetching user count:", error);
      $("#user-count").text("Error");
    }
  });
}

// Initialize the application
App.init();
