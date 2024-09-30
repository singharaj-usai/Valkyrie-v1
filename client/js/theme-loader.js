(function() {
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeLink = document.getElementById('theme-stylesheet');
        themeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/${theme}/bootstrap.min.css`;
        
        // Update CSS variable for user-submenu top position
        let submenuTop = '65px'; // Default value
        if (theme === 'cyborg') {
            submenuTop = '50px'; // Adjust this value as needed for the Cyborg theme
        }
        document.documentElement.style.setProperty('--user-submenu-top', submenuTop);
    }

    const theme = localStorage.getItem('theme') || 'paper';
    applyTheme(theme);

    // Create a style element to hide the body initially
    const style = document.createElement('style');
    style.textContent = 'body { visibility: hidden; }';
    document.head.appendChild(style);

    // Remove the style element when the theme is loaded
    window.addEventListener('load', function() {
        document.head.removeChild(style);
        document.body.style.visibility = 'visible';
    });
})();