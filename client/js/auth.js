$(document).ready(function() {
    function validateForm(form, isSignup) {
        const username = $('#username').val();
        const password = $('#password').val();
        const confirmPassword = isSignup ? $('#confirm-password').val() : password;

        let isValid = true;
        let errorMessages = [];

        if (username.trim() === '') {
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
        const badWords = ['fuck', 'shit', 'ass', 'bitch', 'cunt', 'damn', 'hell', 'whore', 'dick', 'piss', 'pussy'];
        
        // Check if username contains any bad words
        if (badWords.some(word => username.toLowerCase().includes(word))) {
            isValid = false;
            errorMessages.push("Username contains inappropriate words.");
        }

        if (password.trim() === '') {
            isValid = false;
            errorMessages.push("Password cannot be empty.");
        }
        
        if (isSignup && password !== confirmPassword) {
            isValid = false;
            errorMessages.push("Passwords do not match.");
        }

        if (!isValid) {
            showAlert('danger', errorMessages.join('<br>'));
        } else {
            hideAlert();
        }

        return isValid;
    }

    // Load navbar
    $.get('/navbar.html', function(data) {
        $('#navbar-container').html(data);
        updateAuthUI();
      });

        // Check if user is already logged in
    function checkAuth() {
        const username = localStorage.getItem("username");
        const currentPath = window.location.pathname;
        if (username) {
            if (currentPath === '/login.html' || currentPath === '/signup.html') {
                window.location.href = '/';
            } else {
                $('#loading').hide();
                $('#content').show();
            }
        } else {
            if (currentPath !== '/login.html' && currentPath !== '/signup.html') {
                window.location.href = '/login.html';
            } else {
                $('#loading').hide();
                $('#content').show();
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
        $('#alert-container').html(alertHtml);
    }

    function hideAlert() {
        $('#alert-container').empty();
    }

    $('#signup-form').on('submit', function(e) {
        e.preventDefault();
        if (validateForm(this, true)) {
            const username = $('#username').val();
            const password = $('#password').val();
            const confirmPassword = $('#confirm-password').val();

            $.ajax({
                url: '/api/signup',
                method: 'POST',
                data: { username, password, confirmPassword },
                success: function(response) {
                    showAlert('success', 'Sign up successful! Please log in.');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                },
                error: function(xhr, status, error) {
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        const errorMessages = xhr.responseJSON.errors.map(err => err.msg).join('<br>');
                        showAlert('danger', 'Error signing up:<br>' + errorMessages);
                    } else {
                        showAlert('danger', 'Error signing up: ' + xhr.responseText);
                    }
                }
            });
        }
    });

    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        if (validateForm(this, false)) {
            const username = $('#username').val();
            const password = $('#password').val();

            $.ajax({
                url: '/api/login',
                method: 'POST',
                data: { username, password },
                success: function(response) {
                    localStorage.setItem('username', response.username);
                    window.location.href = '/';
                },
                error: function(xhr, status, error) {
                    showAlert('danger', 'Error logging in: ' + xhr.responseText);
                }
            });
        }
    });
});