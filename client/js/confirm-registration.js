$(document).ready(function() {
    showAlert("info", "Please check your email for a verification link to complete your registration.");
});

function showAlert(type, message) {
    $("#alert-container").html(`<div class="alert alert-${type}">${message}</div>`);
}