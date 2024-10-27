$(document).ready(function () {
  const token = localStorage.getItem('token');
  const isBanned = localStorage.getItem('isBanned') === 'true';
  const banReason = localStorage.getItem('banReason');
  const banDate = localStorage.getItem('banDate');

  if (isBanned && banReason) {
      displayBanInfo(banReason, banDate);
  } else if (token) {
      checkBanStatus(token);
  } else {
      window.location.href = '/login';
  }
});

function displayBanInfo(reason, date) {
  $('#ban-reason').text(reason || 'No reason provided');
  $('#ban-date').text(formatDate(date) || 'Unknown');
  $('body').removeClass('hidden');
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
              localStorage.setItem('banDate', response.banDate);
              displayBanInfo(response.banReason, response.banDate);
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

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  });
}