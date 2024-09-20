$(document).ready(function () {
    $('#upload-form').on('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const token = localStorage.getItem('token');

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
                'Authorization': `Bearer ${token}`
            },
            success: function (response) {
                showAlert('success', 'Game uploaded successfully!');
                setTimeout(() => {
                    window.location.href = `/games?id=${response.gameId}`;
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