$(document).ready(function () {
  const token = localStorage.getItem('token');
  const isBanned = localStorage.getItem('isBanned') === 'true';
  const banReason = localStorage.getItem('banReason');

  if (isBanned && banReason) {
    displayBanReason(banReason);
  } else if (token) {
    checkBanStatus(token);
  } else {
    window.location.href = '/login';
  }
});

function displayBanReason(reason) {
  $('#ban-reason').text(`Reason: ${reason || 'No reason provided'}`);
  $('#loading').hide();
  $('#content').show();
}

function checkBanStatus(token) {
  $.ajax({
    url: '/api/auth/check-ban',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (response) {
      if (response.isBanned) {
        localStorage.setItem('isBanned', 'true');
        localStorage.setItem('banReason', response.banReason);
        displayBanReason(response.banReason);
      } else {
        window.location.href = '/';
      }
    },
    error: function (xhr) {
      console.error('Error checking ban status:', xhr.responseText);
      window.location.href = '/login';
    },
  });
}