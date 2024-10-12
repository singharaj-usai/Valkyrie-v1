$(document).on('click', '.accept-request', function () {
  const userId = $(this).data('id');
  sendFriendAction(
    '/api/friends/accept-friend-request/' + userId,
    'Friend request accepted'
  );
});

$(document).on('click', '.decline-request', function () {
  const userId = $(this).data('id');
  sendFriendAction(
    '/api/friends/decline-friend-request/' + userId,
    'Friend request declined'
  );
});

$(document).on('click', '.unfriend', function () {
  const userId = $(this).data('id');
  sendFriendAction(
    '/api/friends/unfriend/' + userId,
    'Unfriended successfully'
  );
});

function sendFriendAction(url, successMessage) {
  const token = localStorage.getItem('token');

  $.ajax({
    url: url,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (response) {
      alert(successMessage);
      fetchFriendRequests();
      fetchFriendsList();
    },
    error: function (xhr, status, error) {
      alert(
        'Error: ' +
          (xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error')
      );
    },
  });
}
