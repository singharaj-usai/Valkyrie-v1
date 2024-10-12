$(document).ready(function () {
  // Load Navbar and User Submenu
  App.init();
  App.updateAuthUI();

  // Populate recipient from query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const recipient = urlParams.get('recipient');
  if (recipient) {
    $('#recipient').val(recipient);
  } else {
    showAlert('danger', 'No recipient specified.');
  }

  // Handle form submission
  $('#compose-form').on('submit', function (e) {
    e.preventDefault();
    const recipientUsername = $('#recipient').val();
    const subject = $('#subject').val().trim();
    const message = $('#message').val().trim();

    if (!subject || !message) {
      showAlert('danger', 'Subject and Message are required.');
      return;
    }

    const token = localStorage.getItem('token');

    $.ajax({
      url: '/api/messages/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        recipient: recipientUsername,
        subject: subject,
        message: message,
      }),
      success: function (response) {
        showAlert('success', 'Message sent successfully.');
        // Optionally redirect after a delay
        setTimeout(() => {
          window.location.href = `/my/messages`;
        }, 2000);
      },
      error: function (xhr) {
        const errorMsg =
          xhr.responseJSON && xhr.responseJSON.error
            ? xhr.responseJSON.error
            : 'Failed to send message.';
        showAlert('danger', errorMsg);
      },
    });
  });

  // Handle Discard button
  $('#discard-button').on('click', function () {
    window.history.back();
  });

  // Function to show alerts
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
});
