function initializeShirts() {
  loadShirts();
  setupShirtToggler();
  setupShirtEditModal();
}

function loadShirts() {
  const token = localStorage.getItem('token');
  $.ajax({
    url: '/api/shirts/user',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (shirts) {
      displayShirts(shirts);
    },
    error: function (xhr, status, error) {
      console.error('Error fetching shirts:', error);
    },
  });
}

function displayShirts(shirts) {
  const shirtsContainer = $('#shirts-container');
  shirtsContainer.empty();

  if (shirts.length === 0) {
    shirtsContainer.append('<p>You have not created any shirts yet.</p>');
    return;
  }

  const table = $(`
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Thumbnail</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Asset ID</th>
                    <th>Price</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    `);

  const tableBody = table.find('tbody');

  shirts.forEach((shirt) => {
    const row = $(`
            <tr>
                <td><img src="${shirt.ThumbnailLocation}" alt="${
      shirt.Name
    }" style="max-width: 50px; max-height: 50px;"></td>
                <td>${shirt.Name}</td>
                <td>${shirt.Description.substring(0, 50)}${
      shirt.Description.length > 50 ? '...' : ''
    }</td>
                <td>${shirt.assetId}</td>
                <td>${shirt.Price}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-shirt" data-shirt-id="${
                      shirt._id
                    }">Edit</button>
                </td>
            </tr>
        `);
    tableBody.append(row);
  });

  shirtsContainer.append(table);
}

function setupShirtToggler() {
  $('#list-tab a').on('click', function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $('#list-shirts-list').on('shown.bs.tab', function (e) {
    loadShirts();
  });
}

function setupShirtEditModal() {
  $(document).on('click', '.edit-shirt', function () {
    const shirtId = $(this).data('shirt-id');
    openShirtEditModal(shirtId);
  });

  $('#save-shirt-changes').on('click', function () {
    saveShirtChanges();
  });
}

function openShirtEditModal(shirtId) {
  const token = localStorage.getItem('token');
  $.ajax({
    url: `/api/shirts/${shirtId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (shirt) {
      $('#edit-shirt-id').val(shirt._id);
      $('#edit-shirt-title').val(shirt.Name);
      $('#edit-shirt-description').val(shirt.Description);
      $('#edit-shirt-price').val(shirt.Price);
      $('#current-shirt-thumbnail').attr('src', shirt.ThumbnailLocation);
      $('#editShirtModal').modal('show');
    },
    error: function (xhr, status, error) {
      console.error('Error fetching shirt details:', error);
    },
  });
}

function saveShirtChanges() {
  const token = localStorage.getItem('token');
  const shirtId = $('#edit-shirt-id').val();
  const title = $('#edit-shirt-title').val();
  const description = $('#edit-shirt-description').val();
  const price = $('#edit-shirt-price').val();

  const shirtData = {
    title: title,
    description: description,
    price: price,
  };

  $.ajax({
    url: `/api/shirts/${shirtId}`,
    method: 'PUT',
    data: JSON.stringify(shirtData),
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (updatedShirt) {
      $('#editShirtModal').modal('hide');
      loadShirts();
    },
    error: function (xhr, status, error) {
      console.error('Error updating shirt:', error);
      $('#shirt-error-message')
        .text('Error updating shirt: ' + xhr.responseJSON.error)
        .removeClass('hidden');
    },
  });
}

$(document).ready(function () {
  initializeShirts();
});
