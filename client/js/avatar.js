$(document).ready(function () {
    initializeAvatarEditor();
    loadUserAvatar();
});

function initializeAvatarEditor() {
    loadAvatarsItems();
    setupItemSelection();
    Pagination();

}

function loadAvatarsItems() {
    loadShirts();
    // Uncomment these when i do these
    // loadPants();
    // loadHats();
}

function getCurrentlyWornShirtId() {
    const currentlyWearing = $('#currently-wearing [data-type="shirt"]');
    return currentlyWearing.length > 0 ? currentlyWearing.data('id') : null;
}

let currentPage = 1;
let totalPages = 1;
function loadShirts(page = 1) {
    const token = localStorage.getItem('token');
    const currentlyWornShirtId = getCurrentlyWornShirtId();
    console.log('Loading shirts for user, page:', page);

    $.ajax({
        url: `/api/shirts/user?page=${page}&limit=4`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        success: function (res) {
            console.log('Shirts loaded successfully:', res.shirts);
            displayUserShirts(res.shirts, currentlyWornShirtId);
            updatePagination(res.currentPage, res.totalPages);
            totalPages = res.totalPages;
        },
        error: function (xhr, status, error) {
            console.error('Error fetching shirts:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            $('#shirts-container').html('<div class="alert alert-danger">Error loading shirts. Please try again later.</div>');
        },
    });
}

function displayUserShirts(shirts, currentlyWornShirtId) {
    const container = $('#shirts-container');
    container.empty();

    if (!Array.isArray(shirts) || shirts.length === 0) {
        console.log('No shirts available to display');
        container.append('<div class="alert alert-info">No shirts available.</div>');
        return;
    }

    // Get the user ID from local storage
    const token = localStorage.getItem('token');
    let currentUserId = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.userId;
        } catch (error) {
            console.error('Error decoding token:', error);
        }
    }

    console.log('Displaying shirts:', shirts.length);
    shirts.forEach((shirt) => {
        if (!shirt || !shirt.Name || !shirt.FileLocation) {
            console.error('Invalid shirt object:', shirt);
            return;
        }
        const isWearing = shirt._id === currentlyWornShirtId;
        const shirtHtml = generateItemHtml(
            shirt.Name,
            shirt.ThumbnailLocation,
            shirt.creator ? shirt.creator.username : 'Unknown',
            shirt._id,
            'shirt',
            shirt.creator && shirt.creator._id === currentUserId ? 'Created' : 'Owned',
            isWearing
        );
        container.append(shirtHtml);
    });
}


function updatePagination(currentPage, totalPages) {
    const paginationContainer = $('#pagination-container');
    paginationContainer.empty();

    if (totalPages <= 1) {
        return;
    }

    const paginationHtml = `
        <ul class="pagination">
            <li class="${currentPage === 1 ? 'disabled' : ''}">
                <a href="#" aria-label="Previous" data-page="${currentPage - 1}">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
            ${generatePageNumbers(currentPage, totalPages)}
            <li class="${currentPage === totalPages ? 'disabled' : ''}">
                <a href="#" aria-label="Next" data-page="${currentPage + 1}">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        </ul>
    `;

    paginationContainer.html(paginationHtml);
}

function generatePageNumbers(currentPage, totalPages) {
    let pageNumbers = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers += `
            <li class="${i === currentPage ? 'active' : ''}">
                <a href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    return pageNumbers;
}

function Pagination() {
    $('#pagination-container').on('click', 'a', function (e) {
        e.preventDefault();
        const page = $(this).data('page');
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            loadShirts(currentPage);
        }
    });
}

function generateItemHtml(name, imageSrc, creator, id, type, ownership, isWearing) {
    return `
        <div class="col-lg-3 col-md-4 col-sm-6 col-xs-6 text-center mb-3">
            <div class="item-card center-block" data-id="${id}" data-type="${type}">
                <div class="thumbnail" style="width: 100%; max-width: 150px; height: 150px; overflow: hidden; margin: 0 auto;">
                    <img src="${imageSrc}" alt="${name}" class="img-responsive center-block" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="caption">
                    <h4 class="text-center">${name}</h4>
                    <p class="text-center"><b>Creator:</b> ${creator}</p>
                    <p class="text-center"><b>Status:</b> ${ownership}</p>
                    <button class="btn btn-block wear-item ${isWearing ? 'btn-success' : 'btn-primary'}" data-id="${id}" data-type="${type}">
                        ${isWearing ? 'Wearing' : 'Wear'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupItemSelection() {
    $(document).on('click', '.wear-item', function () {
        const type = $(this).data('type');
        const itemId = $(this).data('id');
        const isWearing = $(this).hasClass('btn-success');
        
        if (isWearing) {
            removeItem(type);
        } else {
            wearItem(type, itemId);
        }
    });

    $(document).on('click', '.remove-item', function () {
        const type = $(this).data('type');
        removeItem(type);
    });
}

function wearItem(type, itemId) {
    const token = localStorage.getItem('token');

    console.log(`Attempting to wear ${type} with ID: ${itemId}`);

    $.ajax({
        url: '/api/avatar',
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({ type, itemId }),
        success: function (response) {
            console.log('Avatar updated successfully:', response);
            updateAvatarDisplay(type, response.avatar[type]);
            updateCurrentlyWearing(type, response.avatar[type]);
            updateWearButton(type, itemId, true);
            showAlert('success', `Wore your ${type} successfully.`);
            $('.wear-item').removeClass('btn-success').addClass('btn-primary').text('Wear');
            $(`.wear-item[data-id="${itemId}"]`).removeClass('btn-primary').addClass('btn-success').text('Wearing');
        
        },
        error: function (xhr, status, error) {
            console.error(`Error wearing ${type}:`, error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            let errorMessage = `Error wearing ${type}. Please try again later.`;
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            }
            showAlert('danger', errorMessage);
        },
    });
}

function removeItem(type) {
    const token = localStorage.getItem('token');

    $.ajax({
        url: '/api/avatar',
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({ type: type, itemId: null }), // Indicate unwearing
        success: function (response) {
            console.log('Avatar updated successfully.');
            $(`#avatar-${type}`).attr('src', '');
            $(`#currently-wearing [data-type="${type}"]`).remove();
            updateWearButton(type, null, false);
            showAlert('info', `Unwore your ${type}.`);
            $('.wear-item').removeClass('btn-success').addClass('btn-primary').text('Wear');
        },
        error: function (xhr, status, error) {
            console.error('Error unwearing item:', error);
            showAlert('danger', 'Error unwearing the item. Please try again later.');
        },
    });
}

function updateAvatarDisplay(type, item) {
    switch (type) {
        case 'shirt':
            if (item && item.ThumbnailLocation) {
                $('#avatar-shirt').attr('src', item.ThumbnailLocation);
            } else {
                $('#avatar-shirt').attr('src', ''); 
            }
            break;
        // Add cases for 'pants' and 'hat' when i makethem
        default:
            break;
    }
}



function updateCurrentlyWearing(type, item) {
    const container = $('#currently-wearing');
    container.find(`[data-type="${type}"]`).remove();

    if (item && item.ThumbnailLocation && item.Name) {
    const itemHtml = `
        <div class="col-xs-12 col-sm-6 col-md-4" data-type="${type}">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h4 class="panel-title">${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                </div>
                <div class="panel-body">
                    <img src="${item.ThumbnailLocation}" alt="${item.Name}" class="img-responsive center-block" style="max-height: 100px;">
                    <h5 class="text-center">${item.Name}</h5>
                    <button class="btn btn-danger btn-block remove-item" data-type="${type}">Remove</button>
                </div>
            </div>
        </div>
    `;

    container.append(itemHtml);
    }
}

function updateWearButton(type, itemId, isWearing) {
    const wearButtons = $(`.wear-item[data-type="${type}"]`);
    wearButtons.removeClass('btn-success').addClass('btn-primary').text('Wear');

    if (isWearing && itemId) {
        const wearingButton = wearButtons.filter(`[data-id="${itemId}"]`);
        wearingButton.removeClass('btn-primary').addClass('btn-success').text('Wearing');
    }
}

function loadUserAvatar() {
    const token = localStorage.getItem('token');
    $.ajax({
        url: '/api/avatar',
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        success: function (avatar) {
            if (avatar.shirt) {
                wearItem('shirt', avatar.shirtId);
        }
        },
        error: function (xhr, status, error) {
            console.error('Error loading avatar:', error);
            $('#avatar-display').html('<div class="alert alert-danger">Error loading avatar. Please try again later.</div>');
        },
    });
}

function saveAvatarSelection(type, itemId) {
    const token = localStorage.getItem('token');
    const avatarData = { type, itemId };
    console.log(`Saving avatar selection: ${type}, ID: ${itemId}`);

    $.ajax({
        url: '/api/avatar',
        method: 'PUT',
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(avatarData),
        success: function (response) {
            console.log('Avatar updated successfully:', response);
            if (itemId) {
                updateAvatarDisplay(type, response.avatar[type]);
                updateCurrentlyWearing(type, response.avatar);
                updateWearButton(type, itemId, true);
                showAlert('success', `Wore your ${type} successfully.`);
            } else {
                $(`#avatar-${type}`).attr('src', '');
                $(`#currently-wearing [data-type="${type}"]`).remove();
                updateWearButton(type, null, false);
                showAlert('info', `Unwore your ${type}.`);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error updating avatar:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            showAlert('danger', `Error wearing ${type}. Please try again later.`);
        },
    });
}

// basic body colors set up  for seven
function setupBodyColors() {
    const bodyParts = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    const colorPicker = $('<input type="color" id="body-color-picker">');
    const bodyColorContainer = $('#body-colors');

    bodyParts.forEach(part => {
        const partButton = $(`<button class="btn btn-default body-part" data-part="${part}">${part}</button>`);
        bodyColorContainer.append(partButton);
    });

    bodyColorContainer.append(colorPicker);

    $('.body-part').on('click', function() {
        const part = $(this).data('part');
        colorPicker.data('currentPart', part);
        colorPicker.click();
    });

    colorPicker.on('change', function() {
        const color = $(this).val();
        const part = $(this).data('currentPart');
        updateBodyColor(part, color);
    });
}

function updateBodyColor(part, color) {
    // to do
}

function showAlert(type, message) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            ${message}
        </div>
    `;
    $('#avatar-container').prepend(alertHtml);
}


