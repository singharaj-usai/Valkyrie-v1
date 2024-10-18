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
    },
  });
}

function displayShirts(shirts) {
  const shirtsContainer = $('#shirts-container');
  shirtsContainer.empty();

  if (shirts.length === 0) {
    shirtsContainer.append(
      '<div class="col-xs-12"><div class="alert alert-info">No shirts available in the catalog.</div></div>'
    );
    return;
  }

  shirts.forEach((shirt, index) => {
    const shirtPanel = `
            <div class="col-md-3 col-sm-6">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        <h3 class="panel-title">${shirt.Name}</h3>
                    </div>
                    <div class="panel-body">
                        <img src="${
                          shirt.ThumbnailLocation
                        }" class="img-responsive center-block" alt="${
      shirt.Name
    }" style="max-height: 150px;">
                        <hr>
                        <p><strong>Creator:</strong> ${
                          shirt.creator && shirt.creator.username ? shirt.creator.username : 'Unknown'
                        }</p>
                        <p><strong>Price:</strong> ${shirt.Price} currency</p>
                        <p><strong>For Sale:</strong> ${
                          shirt.IsForSale ? 'Yes' : 'No'
                        }</p>
                    </div>
                    <div class="panel-footer">
                        <a href="/catalog/${shirt._id}/${encodeURIComponent(
      shirt.Name
    )}" class="btn btn-primary btn-block">View Details</a>
                    </div>
                </div>
            </div>
        `;
    shirtsContainer.append(shirtPanel);

    if ((index + 1) % 4 === 0) {
      shirtsContainer.append(
        '<div class="clearfix visible-md visible-lg"></div>'
      );
    }
    if ((index + 1) % 2 === 0) {
      shirtsContainer.append('<div class="clearfix visible-sm"></div>');
    }
  });
}
