$(document).ready(function() {
    const pathParts = window.location.pathname.split('/');
    const shirtId = pathParts[2];
    loadShirtDetails(shirtId);
});

function loadShirtDetails(shirtId) {
    $.ajax({
        url: `/api/shirts/${shirtId}`,
        method: 'GET',
        success: function(shirt) {
            displayShirtDetails(shirt);
        },
        error: function(xhr, status, error) {
            console.error('Error fetching shirt details:', error);
            $('#shirt-details').html('<p>Error loading shirt details. Please try again later.</p>');
        }
    });
}

function displayShirtDetails(shirt) {
    const shirtDetailsContainer = $('#shirt-details');
    const isOwner = shirt.creator._id === localStorage.getItem('userId');
    const detailsHtml = `
        <h1>${shirt.Name}</h1>
        <img src="${shirt.ThumbnailLocation}" alt="${shirt.Name}" style="max-width: 300px;">
        <p>${shirt.Description}</p>
        <p>Creator: ${shirt.creator ? shirt.creator.username : 'Unknown'}</p>
        <p>Price: ${shirt.Price} currency</p>
        <p>For Sale: ${shirt.IsForSale ? 'Yes' : 'No'}</p>
        ${isOwner ? '<p>You own this shirt</p>' : (shirt.IsForSale ? '<button id="purchase-btn" class="btn btn-primary">Purchase</button>' : '')}
    `;
    shirtDetailsContainer.html(detailsHtml);

    if (!isOwner && shirt.IsForSale) {
        $('#purchase-btn').on('click', function() {
            purchaseShirt(shirt._id);
        });
    }
}

function purchaseShirt(shirtId) {
    $.ajax({
        url: `/api/shirts/purchase/${shirtId}`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        success: function(response) {
            alert('Shirt purchased successfully!');
            updateCurrency(response.newBalance);
            loadShirtDetails(shirtId); // Reload shirt details to update the UI
        },
        error: function(xhr, status, error) {
            alert('Error purchasing shirt: ' + xhr.responseJSON.error);
        }
    });
}

function updateCurrency(newBalance) {
    $('#currency-amount').text(newBalance);
}