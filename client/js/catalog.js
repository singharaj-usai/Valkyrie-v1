$(document).ready(function() {
    loadCatalog();
});

function loadCatalog() {
    $.ajax({
        url: '/api/catalog/shirts',
        method: 'GET',
        success: function(shirts) {
            displayShirts(shirts);
        },
        error: function(xhr, status, error) {
            console.error('Error fetching catalog:', error);
        }
    });
}

function displayShirts(shirts) {
    const shirtsContainer = $('#shirts-container');
    shirtsContainer.empty();

    if (shirts.length === 0) {
        shirtsContainer.append('<p>No shirts available in the catalog.</p>');
        return;
    }

    shirts.forEach(shirt => {
        const shirtCard = `
            <div class="col-md-3 mb-4">
                <div class="card">
                    <img src="${shirt.ThumbnailLocation}" class="card-img-top" alt="${shirt.Name}">
                    <div class="card-body">
                        <h5 class="card-title">${shirt.Name}</h5>
                        <p class="card-text">Creator: ${shirt.creator ? shirt.creator.username : 'Unknown'}</p>
                        <p class="card-text">Price: ${shirt.Price} currency</p>
                        <p class="card-text">For Sale: ${shirt.IsForSale ? 'Yes' : 'No'}</p>
                        <a href="/catalog/${shirt._id}/${encodeURIComponent(shirt.Name)}" class="btn btn-primary">View Details</a>
                    </div>
                </div>
            </div>
        `;
        shirtsContainer.append(shirtCard);
    });
}