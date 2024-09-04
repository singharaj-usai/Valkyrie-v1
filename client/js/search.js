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
    let html = '<ul class="list-group">';
    if (users.length === 0) {
        html = "<p>No users found.</p>";
    } else {
        users.forEach((user) => {
            html += `<li class="list-group-item"><a href="/user-profile.html?username=${encodeURIComponent(user.username)}">${escapeHtml(user.username)}</a></li>`;
        });
        html += "</ul>";
    }
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

  // Check if we're on the search results page
  if (window.location.pathname === "/search-results.html") {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("q") || "";
    $("#search-input").val(searchTerm);
    performSearch(searchTerm);
  }
});
