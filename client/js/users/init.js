$(document).ready(function () {
  // Check if we're on the search results page and perform initial search
  if (window.location.pathname === '/users') {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q') || '';
    const page = parseInt(urlParams.get('page')) || 1;
    $('#search-input').val(searchTerm);
    if (searchTerm) {
      performSearch(searchTerm, page);
    }
  }

  // Handle search form submission
  $('#search-form').on('submit', function (e) {
    e.preventDefault();
    const searchTerm = $('#search-input').val();
    performSearch(searchTerm, 1);
  });

  // Handle pagination clicks
  $(document).on('click', '#pagination a', function (e) {
    e.preventDefault();
    const page = $(this).data('page');
    const searchTerm = $('#search-input').val();
    performSearch(searchTerm, page);
  });
});
