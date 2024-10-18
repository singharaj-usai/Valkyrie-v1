$(document).ready(function () {
  loadCatalog();
});

function loadCatalog() {
  $.ajax({
    url: '/api/catalog/shirts',
    method: 'GET',
    success: function (shirts) {
      displayShirts(shirts);
    },
    error: function (xhr, status, error) {
      console.error('Error fetching catalog:', error);
      $('#shirts-container').html('<div class="alert alert-danger">Error loading catalog. Please try again later.</div>');
    },
  });
}

function displayShirts(shirts) {
  const shirtsContainer = $('#shirts-container');
  shirtsContainer.empty();

  const panel = $('<div class="panel panel-primary">').appendTo(shirtsContainer);
  const panelHeading = $('<div class="panel-heading">').appendTo(panel);
  $('<h3 class="panel-title">').text('Shirt Catalog').appendTo(panelHeading);
  const panelBody = $('<div class="panel-body">').appendTo(panel);

  if (shirts.length === 0) {
    panelBody.append('<div class="alert alert-info">No shirts available in the catalog.</div>');
    return;
  }

  for (let i = 0; i < shirts.length; i += 4) {
    const row = $('<div class="row">').appendTo(panelBody);
    
    for (let j = i; j < i + 4 && j < shirts.length; j++) {
      const shirtElement = createShirtElement(shirts[j]);
      row.append(shirtElement);
    }
  }
}

function createShirtElement(shirt) {
  return `
    <div class="col-md-3 col-sm-6 mb-4">
      <div class="thumbnail" style="height: 100%;">
        <div style="position: relative;">
          <a href="/catalog/${shirt._id}/${encodeURIComponent(shirt.Name)}">
              <img src="${shirt.ThumbnailLocation}" alt="${shirt.Name}" class="embed-responsive-item">
          </a>
        </div>
        <div class="caption">
          <h4><a href="/catalog/${shirt._id}/${encodeURIComponent(shirt.Name)}">${shirt.Name}</a></h4>
          <p><strong>Creator:</strong> ${shirt.creator && shirt.creator.username ? shirt.creator.username : 'Unknown'}</p>
          <p><strong>Price:</strong> ${shirt.Price} currency</p>
          <p><strong>For Sale:</strong> ${shirt.IsForSale ? 'Yes' : 'No'}</p>
        </div>
        <div class="panel-footer">
          <a href="/catalog/${shirt._id}/${encodeURIComponent(shirt.Name)}" class="btn btn-primary btn-block">View Details</a>
        </div>
      </div>
    </div>
  `;
}