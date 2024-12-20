function initializeUploadForm() {
  $('#upload-form').on('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append('year', $('input[name="year"]:checked').val());
    const token = localStorage.getItem('token');
    const accessKey = localStorage.getItem('uploadAccessKey');

    // Validate file size
    const thumbnailFile = $('#thumbnail')[0].files[0];

    if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024) {
      showAlert('danger', 'Thumbnail file size must be less than 5MB');
      return;
    }

    const price = $('#price').val();
    if (!price || isNaN(price) || price < 0) {
      showAlert('danger', 'Please enter a valid price (0 or greater)');
      return;
    }

    formData.append('price', price);

    $.ajax({
      url: '/api/shirts/upload',
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
          `Shirt uploaded successfully! Asset ID: ${response.assetId}`
        );
        setTimeout(() => {
          window.location.href = `/catalog/${response.shirtId}`;
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
        showAlert('danger', 'Error uploading shirt: ' + errorMessage);
      },
    });
  });
}
