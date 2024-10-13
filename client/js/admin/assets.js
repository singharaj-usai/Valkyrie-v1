function loadAssets() {
  const contentArea = $('#content-area');
  contentArea.empty();

  const assetSearchHtml = `
      <div class="panel panel-primary">
        <div class="panel-heading">
          <h3 class="panel-title">Asset Lookup</h3>
        </div>
        <div class="panel-body">
          <form id="asset-search-form">
            <div class="form-group">
              <label for="asset-id">Asset ID:</label>
              <input type="number" class="form-control" id="asset-id" required>
            </div>
            <button type="submit" class="btn btn-primary">Search</button>
          </form>
          <div id="asset-result" class="mt-3"></div>
        </div>
      </div>
      <div class="panel panel-primary">
        <div class="panel-heading">
          <h3 class="panel-title">Recent Assets</h3>
        </div>
        <div class="panel-body">
          <div id="recent-assets"></div>
        </div>
      </div>
    `;

  contentArea.html(assetSearchHtml);

  $('#asset-search-form').on('submit', function (e) {
    e.preventDefault();
    const assetId = $('#asset-id').val();
    searchAsset(assetId);
  });

  loadRecentAssets();
}

function openEditAssetModal(assetId) {
    $.ajax({
      url: `/api/admin/assets/${assetId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function (asset) {
        $('#edit-asset-id').val(asset._id);
        $('#edit-asset-name').val(asset.Name);
        $('#edit-asset-description').val(asset.Description);
        $('#edit-asset-price').val(asset.Price);
        $('#current-asset-thumbnail').attr('src', asset.ThumbnailLocation);
        $('#editAssetModal').modal('show');
      },
      error: function (xhr, status, error) {
        console.error('Error fetching asset details:', error);
        alert('Error fetching asset details: ' + xhr.responseJSON.error);
      },
    });
  }

function redrawAsset(assetId) {
  if (confirm('Are you sure you want to redraw this asset?')) {
    $.ajax({
      url: `/api/admin/assets/${assetId}/redraw`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function (response) {
        alert(response.message);
        loadRecentAssets();
      },
    error: function (xhr, status, error) {
      const errorMessage = xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error occurred';
      alert('Error queuing asset redraw: ' + errorMessage);
      console.error('Error queuing asset redraw:', error);
    },
  });
}

function deleteAsset(assetId) {
  if (confirm('Are you sure you want to delete this asset?')) {
    $.ajax({
      url: `/api/admin/assets/${assetId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function () {
        alert('Asset deleted successfully');
        loadAssets();
      },
      error: function (xhr, status, error) {
        alert('Error deleting asset');
      },
    });
  }
}

function displayAssetResult(asset) {
  const assetHtml = `
      <div class="panel panel-info">
        <div class="panel-heading">
          <h3 class="panel-title">Asset Details</h3>
        </div>
        <div class="panel-body">
          <p><strong>ID:</strong> ${asset.assetId}</p>
          <p><strong>Name:</strong> ${asset.Name}</p>
          <p><strong>Description:</strong> ${asset.Description}</p>
          <p><strong>Type:</strong> ${asset.AssetType}</p>
          <p><strong>Creator:</strong> ${asset.creator.username}</p>
          <p><strong>Price:</strong> ${asset.Price}</p>
          <p><strong>Sales:</strong> ${asset.Sales}</p>
          <img src="${asset.ThumbnailLocation}" alt="${asset.Name}" style="max-width: 200px;">
          <div class="mt-3">
            <button class="btn btn-warning btn-sm edit-asset" data-asset-id="${asset._id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-asset" data-asset-id="${asset._id}">Delete</button>
            ${asset.canRedraw ? `<button class="btn btn-secondary btn-sm redraw-asset" data-asset-id="${asset._id}">Redraw</button>` : ''}
          </div>
        </div>
      </div>
    `;
  $('#asset-result').html(assetHtml);

  $('.edit-asset').on('click', function () {
    const assetId = $(this).data('asset-id');
    openEditAssetModal(assetId);
  });

  $('.delete-asset').on('click', function () {
    const assetId = $(this).data('asset-id');
    deleteAsset(assetId);
  });

  if (asset.canRedraw) {
    $('.redraw-asset').on('click', function () {
      const assetId = $(this).data('asset-id');
      redrawAsset(assetId);
    });
  }
}

function searchAsset(assetId) {
  $.ajax({
    url: `/api/admin/assets/${assetId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (asset) {
      displayAssetResult(asset);
    },
    error: function (xhr, status, error) {
      $('#asset-result').html(
        '<p class="text-danger">Error: Asset not found</p>'
      );
    },
  });
}

function displayRecentAssets(assets) {
  const assetsContainer = $('#recent-assets');
  assetsContainer.empty();

  if (assets.length === 0) {
    assetsContainer.append('<p>No recent assets found.</p>');
    return;
  }

  const assetsTable = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Creator</th>
          <th>Price</th>
          <th>Sales</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${assets.map((asset) => `
            <tr>
                <td>${asset.assetId}</td>
                <td>${asset.Name}</td>
                <td>${asset.AssetType}</td>
                <td>${asset.creator.username}</td>
                <td>${asset.Price}</td>
                <td>${asset.Sales}</td>
                <td>
                    <button class="btn btn-warning btn-xs edit-asset" data-asset-id="${asset._id}">Edit</button>
                    <button class="btn btn-danger btn-xs delete-asset" data-asset-id="${asset._id}">Delete</button>
                   ${asset.AssetType !== 'Image' ? `<button class="btn btn-secondary btn-xs redraw-asset" data-asset-id="${asset._id}">Redraw</button>` : ''}
                </td>
            </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  assetsContainer.html(assetsTable);

  $('.edit-asset').on('click', function () {
    const assetId = $(this).data('asset-id');
    openEditAssetModal(assetId);
  });

  $('.delete-asset').on('click', function () {
    const assetId = $(this).data('asset-id');
    deleteAsset(assetId);
  });

  $('.redraw-asset').on('click', function () {
    const assetId = $(this).data('asset-id');
    redrawAsset(assetId);
  });
}

function loadRecentAssets() {
  $.ajax({
    url: '/api/admin/assets/recent',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    success: function (assets) {
      displayRecentAssets(assets);
    },
    error: function (xhr, status, error) {
      console.error('Error fetching recent assets:', error);
      $('#recent-assets').html(
        '<p class="text-danger">Error fetching recent assets.</p>'
      );
    },
  });
}

function createEditAssetModal() {
    const modalHtml = `
      <div class="modal fade" id="editAssetModal" tabindex="-1" role="dialog" aria-labelledby="editAssetModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editAssetModalLabel">Edit Asset</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form id="edit-asset-form">
                <input type="hidden" id="edit-asset-id" />
                <div class="form-group">
                  <label for="edit-asset-name">Name:</label>
                  <input type="text" class="form-control" id="edit-asset-name" required />
                </div>
                <div class="form-group">
                  <label for="edit-asset-description">Description:</label>
                  <textarea class="form-control" id="edit-asset-description" rows="3" required></textarea>
                </div>
                <div class="form-group">
                  <label for="edit-asset-price">Price:</label>
                  <input type="number" class="form-control" id="edit-asset-price" required />
                </div>
                <div class="form-group">
                  <label>Current Thumbnail:</label>
                  <img id="current-asset-thumbnail" src="" alt="Asset Thumbnail" style="max-width: 100%; height: auto" />
                </div>
                <div id="edit-asset-error" class="alert alert-danger hidden"></div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="save-asset-changes">Save changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(modalHtml);
    
    // Add event listener for save button
    $(document).on('click', '#save-asset-changes', function() {
      saveAssetChanges();
    });
  }

  function saveAssetChanges() {
    const assetId = $('#edit-asset-id').val();
    const name = $('#edit-asset-name').val();
    const description = $('#edit-asset-description').val();
    const price = $('#edit-asset-price').val();
    const assetData = {Name: name, Description: description, Price: Number(price)};
  
    $.ajax({
      url: `/api/admin/assets/${assetId}`,
      method: 'PUT',
      data: JSON.stringify(assetData),
      contentType: 'application/json',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      success: function (updatedAsset) {
        $('#editAssetModal').modal('hide');
        alert('Asset updated successfully');
        loadRecentAssets();
        // If the asset isin the search result update it
        const displayedAssetId = $('#asset-result').find('.edit-asset').data('asset-id');
        if (displayedAssetId === assetId) {
          searchAsset(updatedAsset.assetId);
        }
      },
      error: function (xhr, status, error) {
        console.error('Error updating asset:', error);
        $('#edit-asset-error')
          .removeClass('hidden')
          .text(`Error updating asset: ${xhr.responseJSON.error}`);
      },
    });
  }
  