let VERSION;

$.getScript('/js/version.js', function() {
  VERSION = window.VERSION;
});

let csrfToken = '';

$.get('/api/auth/csrf-token', function(data) {
  csrfToken = data.csrfToken;
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
//      this.loadTurnstileScript();

   //   this.checkForAnnouncements();
   //   this.initParticles();
    });
  },

 

/*   checkForAnnouncements: function () {
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
  */

  // Load navbar
  loadNavbar: function () {
    $.get("/html/components/navbar.html", (data) => {
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

    // this whole public pages stuff need to be improved, requires whole site refactoring so unauthorized users can view other pages but certain div elements are hidden from them
    const publicPages = [
      "/login",
      "/register",
      "/legal/terms-of-service",
      "/legal/about",
      "/legal/privacy-policy",
      "/forum/home",
      "/games",
    ];

    // all forum pages
    const isForumPage = currentPath.startsWith("/forum/");


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
        error: (xhr, status, error) => {
          if (status === "timeout") {
            console.error("Request timed out. Please check your network connection.");
          } else {
            console.error("Error validating session:", xhr.responseText);
          }
          this.logout();
          if (!publicPages.includes(currentPath) && !isForumPage) {
            window.location.href = "/login";
          }
        },
      });
    } else {
      if (!publicPages.includes(currentPath) && !isForumPage) {
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
         // console.log("User status updated:", response.isOnline);
        },
        error: (xhr, status, error) => {
       //   console.error("Error updating user status:", error);
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
      .replace(/'/g, "&#039;")
      .replace(/`/g, "&#96;")
      .replace(/\//g, "&#47;")
  },

  rateLimitedRequest: function(url, method, data, successCallback, errorCallback) {
    const now = Date.now();
    const lastRequestTime = this.lastRequestTime || 0;
    const minInterval = 1000; // Minimum 1 second between requests
  
    if (now - lastRequestTime < minInterval) {
      console.warn("Rate limit exceeded. Please wait before making another request.");
      return;
    }
  
    this.lastRequestTime = now;
  
    $.ajax({
      url: url,
      method: method,
      data: data,
      timeout: 10000, // 10 seconds timeout
      success: successCallback,
      error: (xhr, status, error) => {
        if (status === "timeout") {
          console.error("Request timed out. Please check your network connection.");
        } else {
          console.error("Error:", error);
        }
        if (errorCallback) errorCallback(xhr, status, error);
      }
    });
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
        success: (response) => {
          authContainer.html(`
            <div class="navbar-text d-flex align-items-center">
              <span id="currency-container" data-toggle="tooltip" data-placement="bottom" title="" style="margin-right: 10px;">
                <i class="bi bi-coin" id="currency-icon"></i> 
                <span id="currency-amount">${response.currency}</span>
              </span>
              <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Profile Picture" class="img-circle" style="width: 30px; height: 30px; margin-right: 10px;">
              <div class="dropdown" style="display: inline-block;">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" style="text-decoration: none; color: inherit; background: none !important;">
                  ${this.escapeHtml(username)} <span class="caret"></span>
                </a>
                <ul class="dropdown-menu" style="min-width: 100%;">
                  <li><a href="/settings" style="padding: 3px 20px;"><i class="fa fa-cog"></i> Settings</a></li>
                  <li><a href="#" id="logout" style="padding: 3px 20px;"><i class="fa fa-sign-out"></i> Logout</a></li>
                </ul>
              </div>
            </div>
          `);
          this.updateCurrencyTooltip(response.lastCurrencyClaimDate);
          this.initLogout();
          $('#user-submenu').show();

          // Initialize the tooltip with HTML support
          $('#currency-container').tooltip({
            trigger: 'hover',
            html: true,
            container: 'body'
          });
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

  // Update the currency tooltip with countdown
  updateCurrencyTooltip: function (lastClaimDate) {
    const tooltipElement = $('#currency-container');

    const updateCountdown = () => {
      const now = new Date();
      const lastClaim = new Date(lastClaimDate);
      const nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      let timeUntilNextClaim = nextClaimTime - now;

      if (timeUntilNextClaim <= 0) {
        // Currency is available; automatically claim it
        tooltipElement.attr('data-original-title', 'Currency available! Granting now...');
        tooltipElement.tooltip('fixTitle');
        this.claimCurrency();
        clearInterval(this.currencyInterval);
        return;
      }

      const hours = Math.floor(timeUntilNextClaim / (60 * 60 * 1000));
      const minutes = Math.floor((timeUntilNextClaim % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeUntilNextClaim % (60 * 1000)) / 1000);

      const tooltipText = `Next currency in ${hours}h ${minutes}m ${seconds}s`;
      tooltipElement.attr('data-original-title', tooltipText);

      // If the tooltip is currently visible, update its content directly
      if ($('.tooltip.in').length && tooltipElement.is(':hover')) {
        $('.tooltip.in .tooltip-inner').html(tooltipText);
      }

      tooltipElement.tooltip('fixTitle');
    };

    // Clear any existing interval to prevent multiple intervals running
    if (this.currencyInterval) {
      clearInterval(this.currencyInterval);
    }

    // Initial countdown update
    updateCountdown();

    // Update countdown every second
    this.currencyInterval = setInterval(updateCountdown, 1000);
  },
  // Claim currency when available
  claimCurrency: function () {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. User might not be logged in.");
      return;
    }
    $.ajax({
      url: "/api/claim-daily-currency",
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      success: (response) => {
        $("#currency-amount").text(response.newBalance);
        this.updateCurrencyTooltip(response.lastClaimDate);
        $('#currency-container').tooltip('show').attr('data-original-title', 'Currency granted!').tooltip('fixTitle');
      },
      error: (xhr) => {
        console.error("Error claiming currency:", xhr.responseText);
        if (xhr.status === 400) {
          // If currency was already claimed, update the tooltip with the correct time
          const errorData = JSON.parse(xhr.responseText);
          if (errorData.lastClaimDate) {
            this.updateCurrencyTooltip(errorData.lastClaimDate);
          }
        }
      },
    });
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
        clearInterval(this.currencyInterval);

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

        // cloudflare captcha
 /*        const turnstileResponse = turnstile.getResponse();
        console.log("Turnstile response:", turnstileResponse);
        if (!turnstileResponse) {
          this.showAlert("danger", "Please complete the captcha.");
          return;
        } */
  

        $.ajax({
          url: "/api/login",
          method: "POST",
          data: { username, password }, //captchaResponse: turnstileResponse },
          headers: { 'CSRF-Token': csrfToken }, //  CSRF token
          success: (response) => {
            localStorage.setItem("token", response.token);
            localStorage.setItem("username", response.username);
            localStorage.setItem('userId', response.userId);
            this.showAlert("success", "Logged in successfully. Redirecting...");
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          },
          error: (xhr) => {
            console.error("Login error:", xhr.responseText);
            const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : "Unknown error";
            this.showAlert("danger", `Error logging in: ${errorMessage}`);
            turnstile.reset();
          },
        });
      }
    });
  },


// load cloudflare captcha
   loadTurnstileScript: function() {
     const script = document.createElement('script');
     script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
     script.async = true;
     script.defer = true;
     document.head.appendChild(script);
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

  

  initLogout: function () {
    $(document).on("click", "#logout", (e) => {
      e.preventDefault();
      this.logout();
    });
  },
  
  loadFooter: function() {
    $.get("/html/components/footer.html", (data) => {
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

// Add this function outside of the App object
function onloadTurnstileCallback() {
  turnstile.render('#cf-turnstile', {
    sitekey: '0x4AAAAAAAw6-tS7TX3o7eld',
    theme: 'light',
  });
}

// Initialize the application
$(document).ready(function() {
  App.init();
});