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

let currentPage = 1;
let totalPages = 1;

function loadShirts(page = 1) {
    const token = localStorage.getItem('token');
    console.log('Loading shirts for user, page:', page);

    $.ajax({
        url: `/api/shirts/user?page=${page}&limit=4`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        success: function (res) {
            console.log('Shirts loaded successfully:', res.shirts.length);
            displayUserShirts(res.shirts);
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

function displayUserShirts(shirts) {
    const container = $('#shirts-container');
    container.empty();

    if (!Array.isArray(shirts) || shirts.length === 0) {
        console.log('No shirts available to display');
        container.append('<div class="alert alert-info">No shirts available.</div>');
        return;
    }

    console.log('Displaying shirts:', shirts.length);
    shirts.forEach((shirt) => {
        if (!shirt || !shirt.Name || !shirt.ThumbnailLocation) {
            console.error('Invalid shirt object:', shirt);
            return;
        }
        const shirtHtml = generateItemHtml(
            shirt.Name,
            shirt.ThumbnailLocation,
            shirt.creator ? shirt.creator.username : 'Unknown',
            shirt.Price,
            shirt._id,
            'shirt'
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
        const page = parseInt($(this).data('page'));
        if (page && page !== currentPage && page >= 1 && page <= totalPages) {
            currentPage = page;
            loadShirts(currentPage);
        }
    });
}

function generateItemHtml(name, imageSrc, creator, id, type) {
    return `
        <div class="col-lg-3 col-md-4 col-sm-6 col-xs-6 text-center mb-3">
            <div class="item-card center-block" data-id="${id}" data-type="${type}">
                <div class="thumbnail" style="width: 100%; max-width: 150px; height: 150px; overflow: hidden; margin: 0 auto;">
                    <img src="${imageSrc}" alt="${name}" class="img-responsive center-block" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="caption">
                    <h4 class="text-center">${name}</h4>
                    <p class="text-center"><b>Creator:</b> ${creator}</p>
                    <button class="btn btn-primary wear-item" data-id="${id}" data-type="${type}">Wear</button>
                </div>
            </div>
        </div>
    `;
}

function setupItemSelection() {
    $(document).on('click', '.select-item', function () {
        const type = $(this).data('type');
        const itemId = $(this).data('id');
        wearItem(type, itemId);
        saveAvatarSelection(type, itemId);
    });
}

function wearItem(type, itemId) {
    const token = localStorage.getItem('token');
    let apiUrl = '';

    switch (type) {
        case 'shirt':
            apiUrl = `/api/shirts/${itemId}`;
            break;
        // Add cases for 'pants' and 'hat' when made
        default:
            return;
    }

    $.ajax({
        url: apiUrl,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        success: function (item) {
            updateAvatarDisplay(type, item.thumbnailUrl); // item.ThumbnailLocation
            updateCurrentlyWearing(type, item);
        },
        error: function (xhr, status, error) {
            console.error(`Error fetching ${type}:`, error);
        },
    });
}

function updateAvatarDisplay(type, imageUrl) {
    switch (type) {
        case 'shirt':
            $('#avatar-shirt').attr('src', imageUrl);
            break;
        // Add cases for 'pants' and 'hat' when i makethem
        default:
            break;
    }
}


function updateCurrentlyWearing(type, item) {
    const container = $('#currently-wearing');
    const existingItem = container.find(`[data-type="${type}"]`);
    
    if (existingItem.length) {
        existingItem.remove();
    }

    const itemHtml = `
        <div class="col-xs-6 col-sm-3" data-type="${type}">
            <div class="thumbnail">
                <img src="${item.ThumbnailLocation}" alt="${item.Name}" class="img-responsive">
                <div class="caption">
                    <h5>${item.Name}</h5>
                    <button class="btn btn-danger btn-sm remove-item" data-type="${type}">Remove</button>
                </div>
            </div>
        </div>
    `;

    container.append(itemHtml);
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
            if (avatar.shirtId) {
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
    const avatarData = {};

    switch (type) {
        case 'shirt':
            avatarData.shirtId = itemId;
            break;
        default:
            return;
    }

    $.ajax({
        url: '/api/avatar',
        method: 'PUT',
        data: JSON.stringify(avatarData),
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        success: function (response) {
            console.log('Avatar updated successfully.');
        },
        error: function (xhr, status, error) {
            console.error('Error updating avatar:', error);
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

$(document).on('click', '.remove-item', function() {
    const type = $(this).data('type');
    removeItem(type);
});

function removeItem(type) {
    $(`#avatar-${type}`).attr('src', '');
    $(`#currently-wearing [data-type="${type}"]`).remove();
    saveAvatarSelection(type, null);
}