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
            'Authorization': `Bearer ${token}`
        },
        success: function(shirts) {
            displayShirts(shirts);
        },
        error: function(xhr, status, error) {
            console.error('Error fetching shirts:', error);
        }
    });
}

function displayShirts(shirts) {
    const shirtsContainer = $('#shirts-container');
    shirtsContainer.empty();

    if (shirts.length === 0) {
        shirtsContainer.append('<p>You have not created any shirts yet.</p>');
        return;
    }

    shirts.forEach(shirt => {
        const shirtElement = $(`
            <div class="list-group-item">
                <h4 class="list-group-item-heading">${shirt.title}</h4>
                <p class="list-group-item-text">${shirt.description}</p>
                <img src="${shirt.thumbnailUrl}" alt="${shirt.title}" style="max-width: 100px; max-height: 100px;">
                <p>Asset ID: ${shirt.assetId}</p>
                <button class="btn btn-primary edit-shirt" data-shirt-id="${shirt._id}">Edit</button>
            </div>
        `);
        shirtsContainer.append(shirtElement);
    });
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
    $(document).on('click', '.edit-shirt', function() {
        const shirtId = $(this).data('shirt-id');
        openShirtEditModal(shirtId);
    });

    $('#save-shirt-changes').on('click', function() {
        saveShirtChanges();
    });
}

function openShirtEditModal(shirtId) {
    const token = localStorage.getItem('token');
    $.ajax({
        url: `/api/shirts/${shirtId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(shirt) {
            $('#edit-shirt-id').val(shirt._id);
            $('#edit-shirt-title').val(shirt.title);
            $('#edit-shirt-description').val(shirt.description);
            $('#current-shirt-thumbnail').attr('src', shirt.thumbnailUrl);
            $('#editShirtModal').modal('show');
        },
        error: function(xhr, status, error) {
            console.error('Error fetching shirt details:', error);
        }
    });
}

function saveShirtChanges() {
    const token = localStorage.getItem('token');
    const shirtId = $('#edit-shirt-id').val();
    const title = $('#edit-shirt-title').val();
    const description = $('#edit-shirt-description').val();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    $.ajax({
        url: `/api/shirts/${shirtId}`,
        method: 'PUT',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(updatedShirt) {
            $('#editShirtModal').modal('hide');
            loadShirts();
        },
        error: function(xhr, status, error) {
            console.error('Error updating shirt:', error);
            $('#shirt-error-message').text('Error updating shirt: ' + error).removeClass('hidden');
        }
    });
}

$(document).ready(function() {
    initializeShirts();
});