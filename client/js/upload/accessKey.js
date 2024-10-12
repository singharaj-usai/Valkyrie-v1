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

function showAccessKeyModal() {
  $('#access-key-modal').modal({
    backdrop: 'static',
    keyboard: false,
    show: true,
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
    },
  });
}
