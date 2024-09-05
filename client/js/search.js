$(document).ready(function () {
  function performSearch(searchTerm) {
    $.ajax({
      url: "/api/search",
      method: "GET",
      data: { username: searchTerm },
      success: function (users) {
        displaySearchResults(users);
      },
      error: function (xhr, status, error) {
        console.error("Error searching users:", error);
        $("#search-results").html(
          "<p>Error searching users. Please try again.</p>"
        );
      },
    });
  }

  function displaySearchResults(users) {
    if (users.length === 0) {
      $("#search-results").html("<p>No users found.</p>");
      return;
    }
  
    let html = '<table class="table table-striped">';
    html += '<thead><tr><th>Avatar</th><th>Username</th><th>Blurb</th><th>Last Logged In</th></tr></thead>';
    html += '<tbody>';
  
    users.forEach((user) => {
      html += `<tr>
    <td><img src="https://via.placeholder.com/50x50.png?text=Avatar" alt="Avatar" class="img-square" width="50" height="50"></td>
        <td><a href="/user-profile.html?username=${encodeURIComponent(user.username)}">${escapeHtml(user.username)}</a></td>
        <td>${user.blurb ? escapeHtml(user.blurb.substring(0, 50) + (user.blurb.length > 50 ? '...' : '')) : 'No blurb'}</td>
        <td>${user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : 'Never'}</td>
      </tr>`;
    });
  
    html += '</tbody></table>';
    $("#search-results").html(html);
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
    performSearch(searchTerm);
  });

  // Check if we're on the search results page and perform initial search
  if (window.location.pathname === "/search-results.html") {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("q") || "";
    $("#search-input").val(searchTerm);
    if (searchTerm) {
      performSearch(searchTerm);
    }
  }
});