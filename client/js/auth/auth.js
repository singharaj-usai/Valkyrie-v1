let VERSION;

$.getScript('./js/version.js', function() {
  VERSION = window.VERSION;
});

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
      this.loadNavbar();
      this.checkAuth();
      this.initSearch();
      this.initForms();
      this.initLogout();
      this.loadFooter();
      this.updateAuthUI();
      this.checkForAnnouncements();
      this.initParticles();


    });
  },

  loadParticles: function () {
    if (!document.getElementById('particles-js')) {
      const particlesContainer = document.createElement('div');
      particlesContainer.id = 'particles-js';
      document.body.insertBefore(particlesContainer, document.body.firstChild);
    }
    
    if (typeof particlesJS === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
      script.onload = () => this.initParticles();
      document.head.appendChild(script);
    } else {
      this.initParticles();
    }
  },
  
  initParticles: function () {
    particlesJS('particles-js', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#007bff" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: false },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#007bff", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 6, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
      },
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes: { grab: { distance: 400, line_linked: { opacity: 1 } }, bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 }, repulse: { distance: 200, duration: 0.4 }, push: { particles_nb: 4 }, remove: { particles_nb: 2 } }
      },
      retina_detect: true
    });
  },

  checkForAnnouncements: function () {
    $.ajax({
      url: "/api/announcements",
      method: "GET",
      success: (response) => {
        if (response.announcement) {
          this.showAnnouncement(response.announcement, response.type);
        }
      },
      error: (xhr) => {
        console.error("Error fetching announcements:", xhr.responseText);
      },
    });
  },
  
  showAnnouncement: function (message, type = 'info') {
    $("#announcement-message").text(message);
    $("#site-wide-announcement")
      .removeClass()
      .addClass(`alert alert-${type} alert-dismissible`)
      .show();
  },
  
  hideAnnouncement: function () {
    $("#site-wide-announcement").hide();
  },

  // Load navbar
  loadNavbar: function () {
    $.get("/navbar.html", (data) => {
      $("#navbar-container").html(data);
      this.updateAuthUI();
      if (typeof updateAnnouncementPosition === 'function') {
        updateAnnouncementPosition();
        // Call it again after a short delay to ensure all elements are properly rendered
        setTimeout(updateAnnouncementPosition, 100);
      }
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
          "Authorization": `Bearer ${token}`,
        },
        success: () => {
          if (["/login", "/register"	].includes(currentPath)) {
            window.location.href = "/";
          } else {
            $("#loading").hide();
            $("#content").show();
          //  this.fetchData();
            this.updateAuthUI();
            this.updateUserStatus();
            // Set up periodic status update
            setInterval(() => this.updateUserStatus(), 60000); // Update every minute
            $('#profile-link').attr('href', `/user-profile?username=${encodeURIComponent(username)}`);
          }
        },
        error: () => {
          this.logout();
          if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/terms-of-service") {
            window.location.href = "/login";
          }
        },
      });
    } else {
      if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/terms-of-service") {
        window.location.href = "/login";
      } else {
        $("#loading").hide();
        $("#content").show();
      }
    }
    if (typeof updateAnnouncementPosition === 'function') updateAnnouncementPosition();
  },


  // Add this new method to update user status
  updateUserStatus: function () {
    const token = localStorage.getItem("token");
    if (token) {
      $.ajax({
        url: "/api/update-status",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        success: (response) => {
          console.log("User status updated:", response.isOnline);
        },
        error: (xhr, status, error) => {
          console.error("Error updating user status:", error);
          if (xhr.status === 401) {
            // Token is invalid or expired, log out the user
            this.logout();
          }
        }
      });
    } else {
      // User is not logged in, clear the interval
      clearInterval(this.statusUpdateInterval);
    }
  },

 /*  // Fetch data from the API
  fetchData: function () {
    $.ajax({
      url: this.config.apiUrl + '?v=' + VERSION,
      method: "GET",
      success: this.handleDataSuccess.bind(this),
      error: this.handleDataError,
    });
  },

  // Handle successful data fetch
  handleDataSuccess: function (data) {
    const html = this.generateHtml(data);
    this.renderHtml(html);
  }, */

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
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const authContainer = $("#auth-container");

  if (username && token) {
    $('#profile-link').attr('href', `/user-profile?username=${encodeURIComponent(username)}`);


    $.ajax({
      url: "/api/user-info",
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
          // Start of Selection
          success: (response) => {
            authContainer.html(`
              <span class="navbar-text">
                Welcome, ${this.escapeHtml(username)} 
                <i class="bi bi-coin"></i> <span id="currency-amount">${response.currency}</span>
              </span>
              <button id="claim-currency" class="btn btn-sm btn-warning ml-2 navbar-btn">Claim Daily</button>
              <button id="logout" class="btn btn-sm btn-default ml-2 navbar-btn">Logout</button>
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
      <a href="/login" class="btn btn-sm btn-primary ml-2 navbar-btn">Login</a>
      <a href="/register" class="btn btn-sm btn-default ml-2 navbar-btn">Register</a>
    `);
    $('#user-submenu').hide();
  }
  if (typeof updateAnnouncementPosition === 'function') updateAnnouncementPosition();
},

  // Handle user logout
  logout: function () {
    const token = localStorage.getItem("token");
    $.ajax({
      url: "/api/logout",
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      success: () => {
        localStorage.removeItem("username");
        localStorage.removeItem("token");
        clearInterval(this.statusUpdateInterval);

        window.location.href = "/login";
      },
      error: (xhr) => {
        console.error("Error logging out:", xhr.responseText);
      } 
    });
  },

  // Initialize search functionality
  initSearch: function () {
    $(document).on("submit", ".navbar-form", (e) => {
      e.preventDefault();
      const searchTerm = $("#search-input").val().trim();
      window.location.href = `/users?q=${encodeURIComponent(searchTerm)}`;
    });
  },

 

  // Initialize form validations
  initForms: function () {
    $("#signup-form").on("submit", (e) => {
      e.preventDefault();
      this.hideAlert(); // Clear any existing alerts

      if (this.validateForm(true)) {
        const formData = {
          username: $("#username").val(),
          email: $("#email").val(),
          password: $("#password").val(),
          confirmPassword: $("#confirm-password").val()
        };
  
        this.showLoadingIndicator();

        $.ajax({
          url: "/api/register-create",
          type: "POST",
          data: JSON.stringify(formData),
          contentType: "application/json",
          success: (response) => {
            this.hideLoadingIndicator();
            this.showAlert("success", response.message);
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          },
          error: (xhr, status, error) => {
            this.hideLoadingIndicator();
            if (status === "timeout") {
              // Assume the account was created successfully
              this.showAlert("success", "Your account has been created successfully. You can now log in.");
              setTimeout(() => {
                window.location.href = "/login";
              }, 5000);
            } else {
              this.handleRegistrationError(xhr, status, error);
            }
          }
        });
      }
    });
    

    $("#login-form").on("submit", (e) => {
      e.preventDefault();
      this.hideAlert(); // Clear any existing alerts

      if (this.validateForm(false)) {
        const username = $("#username").val();
        const password = $("#password").val();

        $.ajax({
          url: "/api/login",
          method: "POST",
          data: { username, password },
          success: (response) => {
            localStorage.setItem("token", response.token);
            localStorage.setItem("username", response.username);
            this.showAlert("success", "Logged in successfully. Redirecting...");
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          },
          error: (xhr) => {
            const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : "Unknown error";
            this.showAlert("danger", `Error logging in: ${errorMessage}`);
          },
        });
      }
    });
  },

  validateForm: function (isSignup) {
    const username = $("#username").val();
    const email = $("#email").val();
    const password = $("#password").val();
    const confirmPassword = isSignup ? $("#confirm-password").val() : password;

    let isValid = true;
    let errorMessages = [];

    if (username.trim() === "") {
      isValid = false;
      errorMessages.push("Username cannot be empty.");
    }

    if (username.length < 3 || username.length > 18) {
      isValid = false;
      errorMessages.push("Username must be between 3 and 18 characters.");
    }

    if (username.includes(" ")) {
      isValid = false;
      errorMessages.push("Username must not contain spaces.");
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      isValid = false;
      errorMessages.push("Username must only contain letters and numbers.");
    }

    // Array of bad words to check against
    const badWords = [
      "nlgga",
      "nigga",
      "sex",
      "raping",
      "tits",
      "wtf",
      "vag",
      "diemauer",
      "brickopolis",
      ".com",
      ".cf",
      "dicc",
      "nude",
      "kesner",
      "nobe",
      "idiot",
      "dildo",
      "cheeks",
      "anal",
      "boob",
      "horny",
      "tit",
      "fucking",
      "gay",
      "rape",
      "rapist",
      "incest",
      "beastiality",
      "cum",
      "maggot",
      "bloxcity",
      "bullshit",
      "fuck",
      "penis",
      "dick",
      "vagina",
      "faggot",
      "fag",
      "nigger",
      "asshole",
      "shit",
      "bitch",
      "anal",
      "stfu",
      "cunt",
      "pussy",
      "hump",
      "meatspin",
      "redtube",
      "porn",
      "kys",
      "xvideos",
      "hentai",
      "gangbang",
      "milf",
      "whore",
      "cock",
      "masturbate",
    ];

    // Check if username contains any bad words
    if (badWords.some((word) => username.toLowerCase().includes(word))) {
      isValid = false;
      errorMessages.push("Username contains inappropriate words.");
    }

    if (password.trim() === "") {
      isValid = false;
      errorMessages.push("Password cannot be empty.");
    }

    if (isSignup && password !== confirmPassword) {
      isValid = false;
      errorMessages.push("Passwords do not match.");
    }

    // Email domain verification
    if (isSignup) {
      const validDomains = ['outlook.com', 'protonmail.com', 'xdiscuss.net', 'roblox.com', 'icloud.com', 'protonmail.ch', 'google.com',
        "yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br",
        "yahoo.com.mx", "live.com.mx", "hotmail.es", "hotmail.com.mx", "prodigy.net.mx",
        "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",
        "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",
        "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",
        "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de", "web.de", "yahoo.de",
        "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",
        "sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph",
        "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
        "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
        "virgin.net", "wanadoo.co.uk", "bt.com", "bellsouth.net", "charter.net", "cox.net", "earthlink.net", "juno.com",
        "email.com", "games.com", "gmx.net", "hush.com", "hushmail.com", "icloud.com", "inbox.com",
        "lavabit.com", "love.com", "outlook.com", "pobox.com", "rocketmail.com",
        "safe-mail.net", "wow.com", "ygm.com", "ymail.com", "zoho.com", "fastmail.fm",
        "yandex.com", "iname.com", "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
        "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
        "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk"
      ];

      const emailDomain = email.split('@')[1];
      if (!validDomains.includes(emailDomain)) {
        isValid = false;
        errorMessages.push("Invalid email domain.");
      }
    }

    if (isSignup) {
      if (email.trim() === "") {
        isValid = false;
        errorMessages.push("Email cannot be empty.");
      }
  
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        isValid = false;
        errorMessages.push("Invalid email format.");
      }
    }

    if (!isValid) {
      this.hideAlert(); // Clear any existing alerts

      this.showAlert("danger", errorMessages.join("<br>"));
    } else {
      this.hideAlert();
    }

    return isValid;
  },

  showLoadingIndicator: function() {
    $("#signup-form button[type='submit']").prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing up...');
  },
  
   hideLoadingIndicator: function() {
    $("#signup-form button[type='submit']").prop("disabled", false).html('Sign Up');
  },

  handleRegistrationError: function(xhr, status, error) {
    if (status === "timeout") {
      showAlert("danger", "The request timed out. Please try again or check your internet connection.");
    } else if (xhr.responseJSON && xhr.responseJSON.errors) {
      const errorMessages = xhr.responseJSON.errors
        .map((err) => err.msg)
        .join("<br>");
      showAlert("danger", "Error signing up:<br>" + errorMessages);
    } else if (xhr.responseJSON && xhr.responseJSON.error) {
      showAlert("danger", "Error signing up: " + xhr.responseJSON.error);
    } else {
      showAlert("danger", "An unexpected error occurred. Please try again later.");
    }
  },

  showAlert: function(type, message) {
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        ${message}
      </div>
    `;
    $("#alert-container").html(alertHtml);
  },

  hideAlert: function() {
    $("#alert-container").empty();
  },

  initClaimCurrency: function () {
    $("#claim-currency").on("click", (e) => {
      e.preventDefault();
      $.ajax({
        url: "/api/claim-daily-currency",
        method: "POST",
        success: (response) => {
          $("#currency-amount").text(response.newBalance);
          this.showAlert("success", "Daily currency claimed!");
        },
        error: (xhr) => {
          this.showAlert("danger", xhr.responseText || "Error claiming currency.");
        },
      });
    });
  },

  initLogout: function () {
    $(document).on("click", "#logout", (e) => {
      e.preventDefault();
      this.logout();
    });
  },
  
  loadFooter: function() {
    $.get("/footer.html", (data) => {
      $("body").append(data);
      this.updateUserCount();
      setInterval(() => this.updateUserCount(), 60000); // Update every minute

    });
  },

  updateUserCount: function() {
    $.ajax({
      url: "/api/user-count",
      method: "GET",
      success: (response) => {
        const userCountElement = $("#user-count");
        if (userCountElement.length) {
          userCountElement.text(response.count);
        } else {
          console.warn("User count element not found in the DOM");
        }
      },
      error: (xhr, status, error) => {
        console.error("Error fetching user count:", error);
        const userCountElement = $("#user-count");
        if (userCountElement.length) {
          userCountElement.text("Error");
        } else {
          console.warn("User count element not found in the DOM");
        }
            }
    });
  },

};

// Initialize the application
$(document).ready(function() {
  App.init();
});