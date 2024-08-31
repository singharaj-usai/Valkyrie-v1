$(document).ready(function() {
    function validateForm(form) {
        const username = $('#username').val();
        const password = $('#password').val();
        let isValid = true;
        let errorMessages = [];

        if (username.length < 3 || username.length > 18) {
            isValid = false;
            errorMessages.push("Username must be between 3 and 18 characters.");
        }

        if (password.length < 4) {
            isValid = false;
            errorMessages.push("Password must be at least 4 characters long.");
        }

        if (!isValid) {
            showAlert('danger', errorMessages.join('<br>'));
        } else {
            hideAlert();
        }

        return isValid;
    }

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
        if (validateForm(this)) {
            const username = $('#username').val();
            const password = $('#password').val();

            $.ajax({
                url: '/api/signup',
                method: 'POST',
                data: { username, password },
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
        if (validateForm(this)) {
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