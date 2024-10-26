$(document).ready(function () {
  const pathParts = window.location.pathname.split('/');
  const shirtId = pathParts[2];
  loadShirtDetails(shirtId);
});

function loadShirtDetails(shirtId) {
  $.ajax({
    url: `/api/shirts/${shirtId}`,
    method: 'GET',
    success: function (shirt) {
      displayShirtDetails(shirt);
    },
    error: function (xhr, status, error) {
      console.error('Error fetching shirt details:', error);
      console.error('Status:', status);
      console.error('Response:', xhr.responseText);
      $('#shirt-details').html('<p>Error loading shirt details. Please try again later.</p>');
    },
  });
}

function displayShirtDetails(shirt) {
  const shirtDetailsContainer = $('#shirt-details');
  const detailsHtml = `
    <div class="panel panel-primary">
      <div class="panel-heading">
        <h3 class="panel-title">${shirt.Name}</h3>
      </div>
      <div class="panel-body">
        <div class="row">
          <div class="col-md-6">
            <div class="thumbnail">
              <img src="${shirt.ThumbnailLocation}" alt="${shirt.Name}" class="img-responsive">
            </div>
          </div>
          <div class="col-md-6">
            <h4>Created by <a href="/user-profile?username=${encodeURIComponent(shirt.creator.username)}">${shirt.creator ? shirt.creator.username : 'Unknown'}</a></h4>
            <hr>
            <div class="well">
              <h4>Description</h4>
              <p>${shirt.Description}</p>
            </div>
            <div class="panel panel-info">
              <div class="panel-heading">
                <h3 class="panel-title">Shirt Details</h3>
              </div>
              <div class="panel-body">
                <p><strong>Price:</strong> ${shirt.Price} currency</p>
                <p><strong>For Sale:</strong> ${shirt.IsForSale ? '<span class="label label-success">Yes</span>' : '<span class="label label-danger">No</span>'}</p>
              </div>
            </div>
            <div id="purchase-section" class="text-center"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  shirtDetailsContainer.html(detailsHtml);

  checkOwnership(shirt._id);
}

function checkOwnership(shirtId) {
  $.ajax({
    url: `/api/shirts/check-ownership/${shirtId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (response) {
      if (response.owned) {
        $('#purchase-section').html(
          '<div class="alert alert-info">You own this shirt</div>'
        );
      } else if (response.isCreator) {
        $('#purchase-section').html(
          '<div class="alert alert-info">You are the creator of this shirt</div>'
        );
      } else {
        // Use response.price instead of shirt.Price
        $('#purchase-section').html(`
          <button id="purchase-btn" class="btn btn-primary btn-lg btn-block">
            <i class="fa fa-shopping-cart"></i> Purchase for ${response.price} currency
          </button>
        `);
        $('#purchase-btn').on('click', function () {
          purchaseShirt(shirtId);
        });
      }
    },
    error: function (xhr, status, error) {
      console.error('Error checking shirt ownership:', error);
      $('#purchase-section').html(
        '<div class="alert alert-danger">Error checking ownership status</div>'
      );
    },
  });
}
function purchaseShirt(shirtId) {
  $.ajax({
    url: `/api/shirts/purchase/${shirtId}`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (response) {
      showAlert('success', 'Shirt purchased successfully!');
      updateCurrency(response.newBalance);
      setTimeout(function () {
        loadShirtDetails(shirtId);
      }, 2000); // refresh after 2 second
    },
    error: function (xhr, status, error) {
      console.error('Error purchasing shirt:', xhr.responseJSON);
      let errorMessage = 'Error purchasing shirt. Please try again later.';
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      }
      showAlert('danger', errorMessage);
    },
  });
}

function updateCurrency(newBalance) {
  $('#currency-amount').text(newBalance);
}

function showAlert(type, message) {
  const alertHtml = `
        <div class="alert alert-${type} alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            ${message}
        </div>
    `;
  $('#shirt-details').prepend(alertHtml);
}
