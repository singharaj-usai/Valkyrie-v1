$(document).ready(function() {
    // Initialize the page
    App.init();
    loadUserSettings();

    // Handle save settings button click
    $('#save-settings').on('click', saveUserSettings);
});

function loadUserSettings() {
    const theme = localStorage.getItem('theme') || 'cyborg';
    $('#theme-select').val(theme);
    applyTheme(theme);
}

function saveUserSettings() {
    const theme = $('#theme-select').val();
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    showAlert('Settings saved successfully!', 'success');
}

function applyTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const themeStylesheet = document.getElementById('theme-stylesheet');
    themeStylesheet.href = `https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/${theme}/bootstrap.min.css`;
    
    // Update CSS variable for user-submenu top position
    let submenuTop = '65px'; // Default value
    if (theme === 'cyborg') {
        submenuTop = '50px'; // Adjust this value as needed for the Cyborg theme
    }
    document.documentElement.style.setProperty('--user-submenu-top', submenuTop);
    
    // Trigger submenu position update
    if (typeof updateSubmenuPosition === 'function') {
        updateSubmenuPosition();
    }
}

function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            ${message}
        </div>
    `;
    $('#settings-alert-container').html(alertHtml);
}