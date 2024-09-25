function displayPagination(total, currentPage) {
    const totalPages = Math.ceil(total / usersPerPage);
    let paginationHtml =  `
    <nav aria-label="Search results pages">
      <ul class="pagination">
  `;
  
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `
        <li class="${i === currentPage ? 'active' : ''}">
          <a href="?page=${i}" data-page="${i}">${i}
            ${i === currentPage ? '<span class="sr-only">(current)</span>' : ''}
          </a>
        </li>
      `;
    }
  
    paginationHtml += '</ul></nav>';
    $("#pagination").html(paginationHtml);
  }