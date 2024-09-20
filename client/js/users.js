$(document).ready(function () {
  let currentPage = 1;
  const usersPerPage = 10;

  function performSearch(searchTerm, page = 1) {
    $.ajax({
      url: "/api/search",
      method: "GET",
      data: { username: searchTerm, page: page, limit: usersPerPage },
      success: function (response) {
        displaySearchResults(response.users);
        displayPagination(response.total, page);
      },
      error: function (xhr, status, error) {
        console.error("Error searching users:", error);
        $("#user-search-results").html(
          "<p>Error searching users. Please try again.</p>"
        );
      },
    });
  }

  function displaySearchResults(users) {
    if (users.length === 0) {
      $("#user-search-results").html("<p>No users found.</p>");
      return;
    }
  
    let html = '<table class="table table-striped">';
    html += '<thead><tr><th>Avatar</th><th>Username</th><th>Blurb</th><th>Last Logged In</th><th>Status</th></tr></thead>';
  html += '<tbody>';

  const fetchStatusPromises = users.map(user => fetchUserStatus(user.username));

  Promise.all(fetchStatusPromises).then(statuses => {
    users.forEach((user, index) => {
      const onlineStatus = statuses[index] 
        ? '<span class="text-success"><i class="bi bi-circle-fill"></i> Online</span>' 
        : '<span class="text-danger"><i class="bi bi-circle-fill"></i> Offline</span>';
      html += `<tr>
        <td><img src="https://via.placeholder.com/50x50.png?text=Avatar" alt="Avatar" class="img-square" width="50" height="50"></td>
        <td><a href="/user-profile?username=${encodeURIComponent(user.username)}">${escapeHtml(user.username)}</a></td>
        <td>${user.blurb ? escapeHtml(user.blurb.substring(0, 50) + (user.blurb.length > 50 ? '...' : '')) : 'No blurb'}</td>
        <td>${user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : 'Never'}</td>
        <td>${onlineStatus}</td>
      </tr>`;
    });
  
      html += '</tbody></table>';
      $("#user-search-results").html(html);
    });
  }
  
  function fetchUserStatus(username) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/user-status/${username}`,
        method: 'GET',
        success: function (response) {
          resolve(response.isOnline);
        },
        error: function (xhr, status, error) {
          console.error('Error fetching user status:', error);
          resolve(false);
        }
      });
    });
  }

  function displayPagination(total, currentPage) {
    const totalPages = Math.ceil(total / usersPerPage);
    let paginationHtml = '<nav><ul class="pagination">';

    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<li class="${i === currentPage ? 'active' : ''}"><a href="#" data-page="${i}">${i}</a></li>`;
    }

    paginationHtml += '</ul></nav>';
    $("#pagination").html(paginationHtml);
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Handle search form submission
  $("#search-form").on("submit", function (e) {
    e.preventDefault();
    const searchTerm = $("#search-input").val();
    currentPage = 1;

    performSearch(searchTerm, currentPage);
  });

   // Handle pagination clicks
   $(document).on('click', '#pagination a', function(e) {
    e.preventDefault();
    const page = $(this).data('page');
    const searchTerm = $("#search-input").val();
    performSearch(searchTerm, page);
  });

  // Check if we're on the search results page and perform initial search
  if (window.location.pathname === "/users") {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("q") || "";
    $("#search-input").val(searchTerm);
    if (searchTerm) {
      performSearch(searchTerm, currentPage);
    }
  }
});