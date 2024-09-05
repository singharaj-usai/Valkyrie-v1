$(document).ready(function () {
  function validateForm(form, isSignup) {
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

    if (/^[a-zA-Z0-9][\w\.]$/.test(username)) {
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

    if (!isValid) {
      showAlert("danger", errorMessages.join("<br>"));
    } else {
      hideAlert();
    }

    return isValid;
  }

  // Load navbar
  $.get("/navbar.html", function (data) {
    $("#navbar-container").html(data);
    updateAuthUI();
  });

  // Check if user is already logged in
  function checkAuth() {
    const username = localStorage.getItem("username");
    const currentPath = window.location.pathname;
    if (username) {
      if (currentPath === "/login.html" || currentPath === "/register.html") {
        window.location.href = "/";
      } else {
        $("#loading").hide();
        $("#content").show();
      }
    } else {
      if (currentPath !== "/login.html" && currentPath !== "/register.html") {
        window.location.href = "/login.html";
      } else {
        $("#loading").hide();
        $("#content").show();
      }
    }
  }

  // Call checkAuth when the page loads
  checkAuth();

  function showAlert(type, message) {
    const alertHtml = `
            <div class="alert alert-${type} alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                ${message}
            </div>
        `;
    $("#alert-container").html(alertHtml);
  }

  function hideAlert() {
    $("#alert-container").empty();
  }

  // Function to get CSRF token
  function getCsrfToken() {
    return $.ajax({
      url: "/api/csrf-token",
      method: "GET",
    });
  }

  // Helper function to set CSRF token in AJAX headers
  function setCSRFToken(securityToken) {
    $.ajaxSetup({
      headers: {
        "X-CSRF-Token": securityToken,
      },
    });
  }

  // Get CSRF token when page loads
  getCsrfToken().then(function (response) {
    setCSRFToken(response.csrfToken);
  });

  $("#signup-form").on("submit", function (e) {
    e.preventDefault();
    if (validateForm(this, true)) {
      const formData = {
        username: $("#username").val(),
        email: $("#email").val(),
        password: $("#password").val(),
        confirmPassword: $("#confirm-password").val()
      };
  
      $.ajax({
        url: "/api/register-create",
        type: "POST",
        data: JSON.stringify(formData),
        contentType: "application/json",
        timeout: 10000,
        success: function (response) {
          showAlert("success", response.message);
          if (response.previewUrl) {
            showAlert("info", `For testing purposes, view the email here: <a href="${response.previewUrl}" target="_blank">Preview Email</a>`);
          }
          setTimeout(() => {
            window.location.href = "/login.html";
          }, 5000);
        },
        error: handleRegistrationError
      });
    }
  });
  
  function handleRegistrationError(xhr, status, error) {
    if (status === "timeout") {
      showAlert("danger", "The request timed out. Please try again.");
    } else if (xhr.responseJSON && xhr.responseJSON.errors) {
      const errorMessages = xhr.responseJSON.errors
        .map((err) => err.msg)
        .join("<br>");
      showAlert("danger", "Error signing up:<br>" + errorMessages);
    } else if (xhr.responseJSON && xhr.responseJSON.error) {
      showAlert("danger", "Error signing up: " + xhr.responseJSON.error + "<br>Details: " + xhr.responseJSON.details);
    } else {
      showAlert("danger", "Error signing up: " + xhr.responseText);
    }
  }

  $("#login-form").on("submit", function (e) {
    e.preventDefault();
    if (validateForm(this, false)) {
      const username = $("#username").val();
      const password = $("#password").val();

      $.ajax({
        url: "/api/login",
        method: "POST",
        data: { username, password },
        success: function (response) {
          localStorage.setItem("username", response.username);
          window.location.href = "/";
        },
        error: function (xhr, status, error) {
          if (xhr.status === 403 && xhr.responseText === "Please verify your email before logging in") {
            showAlert("warning", "Please verify your email before logging in. Check your inbox for the verification link.");
          } else {
            showAlert("danger", "Error logging in: " + xhr.responseText);
          }
        },
      });
    }
  });
});
