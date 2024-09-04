$(document).ready(function() {
    $("#confirm-registration").on("click", function() {
        const tempUserData = JSON.parse(localStorage.getItem('tempUserData'));
        if (!tempUserData) {
            showAlert("danger", "No registration data found. Please try signing up again.");
            return;
        }

        $.ajax({
            url: "/api/register-create",
            type: "POST",
            data: JSON.stringify(tempUserData),
            contentType: "application/json",
            timeout: 10000,
            success: function(response) {
                localStorage.removeItem('tempUserData');
                showAlert("success", "Registration successful! You can now log in.");
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            },
            error: handleRegistrationError
        });
    });

    function showAlert(type, message) {
        $("#alert-container").html(`<div class="alert alert-${type}">${message}</div>`);
    }

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
});