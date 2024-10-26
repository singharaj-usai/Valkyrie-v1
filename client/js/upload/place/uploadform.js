function initializeUploadForm() {
  $('#upload-form').on('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append('year', $('input[name="year"]:checked').val());
    const token = localStorage.getItem('token');
    const accessKey = localStorage.getItem('uploadAccessKey');

    // Validate file size
    const thumbnailFile = $('#thumbnail')[0].files[0];
    const rbxlFile = $('#rbxlFile')[0].files[0];

    if (thumbnailFile && thumbnailFile.size > 20 * 1024 * 1024) {
      showAlert('danger', 'Thumbnail file size must be less than 20MB');
      return;
    }

    if (rbxlFile && rbxlFile.size > 20 * 1024 * 1024) {
      showAlert('danger', '.rbxl file size must be less than 20MB');
      return;
    }

    $.ajax({
      url: '/api/games/upload',
      method: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Access-Token': accessKey,
      },
      success: function (response) {
        showAlert(
          'success',
          `Game uploaded successfully! Asset ID: ${response.assetId}`
        );
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
      },
    });
  });
}
