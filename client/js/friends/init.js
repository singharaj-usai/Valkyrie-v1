$(document).ready(function () {
  //console.log('Friends page initialized');
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('No token found. Redirecting to login.');
    window.location.href = '/login';
    return;
  }

  // Initialize tabs
  $('#friendTabs a').on('click', function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  // Make tabs full width (50/50)
  $('#friendTabs').addClass('nav-justified');

  fetchFriendRequests();
  fetchFriendsList();
});
