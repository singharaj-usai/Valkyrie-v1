$(document).ready(function () {
    // Initialize Navbar and Authentication UI
    App.init();
    App.updateAuthUI();

    /**
     * Extract the current user's username from the JWT token.
     * Assumes the token payload contains a 'username' field.
     */
    function getCurrentUsername() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.username;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    const currentUsername = getCurrentUsername();

    // Function to fetch and display messages
    function loadMessages(type) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('danger', 'You must be logged in to view messages.');
            return;
        }

        let url;
        switch (type) {
            case 'inbox':
                url = '/api/messages/received';
                break;
            case 'sent':
                url = '/api/messages/sent';
                break;
            case 'archive':
                url = '/api/messages/archived';
                break;
            default:
                showAlert('danger', 'Invalid message type.');
                return;
        }

        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(messages) {
                if (type === 'inbox') {
                    messages = messages.filter(message => !message.isArchived);
                }
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
                            <th>${type === 'sent' ? 'To' : 'From'}</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            messages.forEach(function(message) {
                const senderOrRecipient = type === 'sent' ? message.recipient.username : message.sender.username;
                messagesHtml += `
                    <tr>
                        <td>
                            <a href="/user-profile?username=${encodeURIComponent(senderOrRecipient)}">
                                <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="32" height="32" style="margin-right: 10px;">
                                ${escapeHtml(senderOrRecipient)}
                            </a>
                        </td>
                        <td>${escapeHtml(message.subject)}</td>
                        <td>${new Date(message.sentAt).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-primary btn-sm view-message" data-id="${message._id}">View</button>
                            ${type === 'inbox' ? `<button class="btn btn-warning btn-sm archive-message" data-id="${message._id}">Archive</button>` : ''}
                            ${type === 'archive' ? `<button class="btn btn-info btn-sm restore-message" data-id="${message._id}">Restore</button>` : ''}
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
        }else if (type === 'archive') {
        $('#archive-messages').html(messagesHtml);
    }

        // Attach event listeners to 'View' buttons
        $('.view-message').off('click').on('click', function() {
            const messageId = $(this).data('id');
            viewMessage(messageId, type);
        });

        // Archive button
    $('.archive-message').off('click').on('click', function() {
        const messageId = $(this).data('id');
            archiveMessage(messageId);
        });

           // Restore messages
    $('.restore-message').off('click').on('click', function() {
        const messageId = $(this).data('id');
        restoreMessage(messageId);
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
                // Remove any existing modal to prevent duplicates
                $('#messageModal').remove();

                // Determine if the current user can reply to this message
                const canReply = currentUsername !== message.sender.username;

                const formattedMessage = `
From: ${escapeHtml(message.sender.username)}<br>
Date: ${new Date(message.sentAt).toLocaleString()}<br><br>
${escapeHtml(message.message).replace(/\n/g, '<br>')}
                `;

                const messageHtml = `
                    <div class="modal fade" id="messageModal" tabindex="-1" role="dialog" aria-labelledby="messageModalLabel">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    ${canReply ? `
                                    <button type="button" class="btn btn-primary" id="reply-button" style="margin-right: 10px;">Reply</button>
                                    ` : ''}
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="position: absolute; right: 10px; top: 10px;">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                    <h4 class="modal-title" id="messageModalLabel">Message Details</h4>
                                </div>
                                <div class="modal-body">
                                    <p>
                                        <a href="/user-profile?username=${encodeURIComponent(message.sender.username)}">
                                            <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="32" height="32" style="margin-right: 10px;">
                                            <strong>From:</strong> ${escapeHtml(message.sender.username)}
                                        </a>
                                    </p>
                                    <p>
                                        <a href="/user-profile?username=${encodeURIComponent(message.recipient.username)}">
                                            <img src="https://www.nicepng.com/png/full/146-1466409_roblox-bacon-hair-png-roblox-bacon-hair-head.png" alt="Avatar" class="img-circle" width="32" height="32" style="margin-right: 10px;">
                                            <strong>To:</strong> ${escapeHtml(message.recipient.username)}
                                        </a>
                                    </p>
                                    <p><strong>Subject:</strong> ${escapeHtml(message.subject)}</p>
                                    <p><strong>Date:</strong> ${new Date(message.sentAt).toLocaleString()}</p>
                                    <hr>
                                    <p>${formattedMessage}</p>
                                    ${canReply ? `
                                    <div id="reply-form-container" style="display: none; margin-top: 20px;">
                                        <form id="reply-form">
                                            <div class="form-group">
                                                <label for="reply-message">Reply:</label>
                                                <textarea class="form-control" id="reply-message" rows="4" maxlength="1000" required></textarea>
                                            </div>
                                            <div class="checkbox">
                                                <label>
                                                    <input type="checkbox" id="include-original" checked> Include original message
                                                </label>
                                            </div>
                                            <button type="submit" class="btn btn-success">Send Reply</button>
                                        </form>
                                    </div>
                                    ` : ''}
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

                // Reply button functionality
                if (canReply) {
                    $('#reply-button').on('click', function() {
                        $('#reply-form-container').toggle();
                    });

                    // Reply form submission
                    $('#reply-form').on('submit', function(e) {
                        e.preventDefault();
                        const replyMessage = $('#reply-message').val().trim();
                        const includeOriginal = $('#include-original').is(':checked');

                        if (replyMessage) {
                            let fullMessage = replyMessage;
                            if (includeOriginal) {
                                fullMessage += `\n\n--- Original Message ---\nFrom: ${escapeHtml(message.sender.username)} on ${new Date(message.sentAt).toLocaleString()}\n${message.message}`;
                            }

                            $.ajax({
                                url: '/api/messages/send',
                                method: 'POST',
                                headers: {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                },
                                data: JSON.stringify({
                                    recipient: message.sender.username,
                                    subject: `Re: ${message.subject}`,
                                    message: fullMessage
                                }),
                                success: function(response) {
                                    showAlert('success', 'Reply sent successfully.');
                                    $('#reply-form')[0].reset();
                                    $('#reply-form-container').hide();
                                    $('#messageModal').modal('hide');
                                },
                                error: function(xhr) {
                                    const errorMsg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to send reply.';
                                    showAlert('danger', errorMsg);
                                }
                            });
                        } else {
                            showAlert('danger', 'Reply message cannot be empty.');
                        }
                    });
                }

                // Remove modal from DOM when hidden
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

    // Archive message fn
    function archiveMessage(messageId) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('danger', 'You must be logged in to archive messages.');
            return;
        }
    
        $.ajax({
            url: `/api/messages/${messageId}/archive`,
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            success: function(response) {
                showAlert('success', 'Message archived successfully.');
                loadMessages('inbox');
                loadMessages('archive');
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to archive message.';
                const errorDetails = xhr.responseJSON && xhr.responseJSON.details ? xhr.responseJSON.details : '';
                console.error('Error archiving message:', errorMsg, errorDetails);
                showAlert('danger', `${errorMsg} ${errorDetails}`);
            }
        });
    }

    // Restore message function
function restoreMessage(messageId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('danger', 'You must be logged in to restore messages.');
        return;
    }

    $.ajax({
        url: `/api/messages/${messageId}/restore`,
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`
        },
        success: function(response) {
            showAlert('success', 'Message restored successfully.');
            loadMessages('inbox');
            loadMessages('archive');
        },
        error: function(xhr) {
            const errorMsg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to restore message.';
            const errorDetails = xhr.responseJSON && xhr.responseJSON.details ? xhr.responseJSON.details : '';
            console.error('Error restoring message:', errorMsg, errorDetails);
            showAlert('danger', `${errorMsg} ${errorDetails}`);
        }
    });
}

    // Function to show alerts
    function showAlert(type, message, duration=5000) { // duration is 5 seconds
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                ${message}
            </div>
        `;
        const $alertContainer = $('#alert-container');
        $alertContainer.html(alertHtml);
        
        // Automatically close the alert after the specified duration
        setTimeout(function() {
            $alertContainer.find('.alert').alert('close');
        }, duration);    }

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
    loadMessages('archive');

    // Reload messages when switching tabs
    $('#messageTabs a').on('shown.bs.tab', function (e) {
        const target = $(e.target).attr("href"); // activated tab
        if (target === '#inbox') {
            loadMessages('inbox');
        } else if (target === '#sent') {
            loadMessages('sent');
        } else if (target === '#archive') {
            loadMessages('archive');
        }
    });
});