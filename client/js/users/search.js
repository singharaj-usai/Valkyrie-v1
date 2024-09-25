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