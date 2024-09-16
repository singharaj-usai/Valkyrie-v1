$(document).ready(function () {
    // Initialize Navbar and Authentication UI
    App.init();
    App.updateAuthUI();

    // Function to fetch and display messages
    function loadMessages(type) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('danger', 'You must be logged in to view messages.');
            return;
        }

        const url = type === 'inbox' ? '/api/messages/received' : '/api/messages/sent';

        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(messages) {
                displayMessages(type, messages);
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to load messages.';
                showAlert('danger', errorMsg);
            }
        });
    }

    // Function to display messages in the respective tab
    function displayMessages(type, messages) {
        let messagesHtml = '';

        if (messages.length === 0) {
            messagesHtml = '<p>No messages found.</p>';
        } else {
            messagesHtml = `
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>${type === 'inbox' ? 'From' : 'To'}</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            messages.forEach(function(message) {
                const senderOrRecipient = type === 'inbox' ? message.sender.username : message.recipient.username;
                messagesHtml += `
                    <tr>
                        <td>${escapeHtml(senderOrRecipient)}</td>
                        <td>${escapeHtml(message.subject)}</td>
                        <td>${new Date(message.sentAt).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-primary btn-sm view-message" data-id="${message._id}">View</button>
                        </td>
                    </tr>
                `;
            });

            messagesHtml += `
                    </tbody>
                </table>
            `;
        }

        if (type === 'inbox') {
            $('#inbox-messages').html(messagesHtml);
        } else if (type === 'sent') {
            $('#sent-messages').html(messagesHtml);
        }

        // Attach event listeners to 'View' buttons
        $('.view-message').on('click', function() {
            const messageId = $(this).data('id');
            viewMessage(messageId, type);
        });
    }

    // Function to view a specific message in a modal
    function viewMessage(messageId, type) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('danger', 'You must be logged in to view messages.');
            return;
        }

        $.ajax({
            url: `/api/messages/${messageId}`,
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(message) {
                const messageHtml = `
                    <div class="modal fade" id="messageModal" tabindex="-1" role="dialog" aria-labelledby="messageModalLabel">
                      <div class="modal-dialog" role="document">
                        <div class="modal-content">
                          <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 class="modal-title" id="messageModalLabel">Message Details</h4>
                          </div>
                          <div class="modal-body">
                            <p><strong>From:</strong> ${escapeHtml(message.sender.username)}</p>
                            <p><strong>To:</strong> ${escapeHtml(message.recipient.username)}</p>
                            <p><strong>Subject:</strong> ${escapeHtml(message.subject)}</p>
                            <p><strong>Date:</strong> ${new Date(message.sentAt).toLocaleString()}</p>
                            <hr>
                            <p>${escapeHtml(message.message)}</p>
                          </div>
                          <div class="modal-footer">
                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                `;
                $('body').append(messageHtml);
                $('#messageModal').modal('show');

                // Remove modal from DOM after it's closed to prevent duplicates
                $('#messageModal').on('hidden.bs.modal', function () {
                    $(this).remove();
                });
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to load message.';
                showAlert('danger', errorMsg);
            }
        });
    }

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

    // Utility function to escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Load messages on page load
    loadMessages('inbox');
    loadMessages('sent');

    // Optionally, reload messages when switching tabs
    $('#messageTabs a').on('shown.bs.tab', function (e) {
        const target = $(e.target).attr("href"); // activated tab
        if (target === '#inbox') {
            loadMessages('inbox');
        } else if (target === '#sent') {
            loadMessages('sent');
        }
    });
});