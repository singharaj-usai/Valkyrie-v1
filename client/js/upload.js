function getAccessKey() {
    let accessKey = localStorage.getItem('uploadAccessKey');
    if (!accessKey) {
        accessKey = prompt('Please enter the upload access key:');
        if (accessKey) {
            localStorage.setItem('uploadAccessKey', accessKey);
        }
    }
    return accessKey;
}

$(document).ready(function () {
    const accessKey = localStorage.getItem('uploadAccessKey');
    if (!accessKey) {
        showAccessKeyModal();
    } else {
        verifyAccessKey(accessKey);
    }

    $('#access-key-form').on('submit', function (e) {
        e.preventDefault();
        const enteredKey = $('#access-key').val();
        verifyAccessKey(enteredKey);
    });

    $('#access-key-modal').on('hide.bs.modal', function (e) {
        if (!localStorage.getItem('uploadAccessKey')) {
            window.location.href = '/';
        }
    });

    function showAccessKeyModal() {
        $('#access-key-modal').modal({
            backdrop: 'static',
            keyboard: false,
            show: true
        });
    }

    function verifyAccessKey(key) {
        $.ajax({
            url: '/api/verify-upload-access',
            method: 'POST',
            data: JSON.stringify({ accessKey: key }),
            contentType: 'application/json',
            success: function (response) {
                if (response.success) {
                    localStorage.setItem('uploadAccessKey', key);
                    $('#access-key-modal').modal('hide');
                    $('#content-wrapper').show();
                    initializeUploadForm();
                } else {
                    alert('Invalid access key. Please try again.');
                    showAccessKeyModal();
                }
            },
            error: function () {
                alert('Error verifying access key. Please try again.');
                showAccessKeyModal();
            }
        });
    }

    function initializeUploadForm() {
        $('#upload-form').on('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const token = localStorage.getItem('token');
            const accessKey = localStorage.getItem('uploadAccessKey');

            // Validate file size
            const thumbnailFile = $('#thumbnail')[0].files[0];
            if (thumbnailFile && thumbnailFile.size > 20 * 1024 * 1024) {
                showAlert('danger', 'Thumbnail file size must be less than 20MB');
                return;
            }

            $.ajax({
                url: '/api/games/upload',
                method: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Access-Token': accessKey
                },
                success: function (response) {
                    showAlert('success', 'Game uploaded successfully!');
                    setTimeout(() => {
                        window.location.href = `/game?id=${response.gameId}`;
                    }, 2000);
                },
                error: function (xhr, status, error) {
                    let errorMessage = 'Unknown error';
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage = xhr.responseJSON.error;
                        if (xhr.responseJSON.details) {
                            errorMessage += ': ' + xhr.responseJSON.details;
                        }
                    }
                    console.error('Upload error:', errorMessage);
                    showAlert('danger', 'Error uploading game: ' + errorMessage);
                }
            });
        });
    }

    function showAlert(type, message) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                ${message}
            </div>
        `;
        $('#alert-container').html(alertHtml);
    }
});