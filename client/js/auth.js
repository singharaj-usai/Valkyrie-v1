$(document).ready(function() {
    function validateForm(form) {
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
        return form.checkValidity();
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
                    alert('Sign up successful! Please log in.');
                    window.location.href = '/login.html';
                },
                error: function(xhr, status, error) {
                    if (xhr.responseJSON && xhr.responseJSON.errors) {
                        const errorMessages = xhr.responseJSON.errors.map(err => err.msg).join('\n');
                        alert('Error signing up:\n' + errorMessages);
                    } else {
                        alert('Error signing up: ' + xhr.responseText);
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
                    alert('Error logging in: ' + xhr.responseText);
                }
            });
        }
    });
});