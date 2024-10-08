(function() {
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeLink = document.getElementById('theme-stylesheet');
        themeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.7/${theme}/bootstrap.min.css`;
        
        let submenuTop = '55px';
        if (theme === 'cyborg') {
            submenuTop = '50px';
        }
        document.documentElement.style.setProperty('--user-submenu-top', submenuTop);
    }

    const theme = localStorage.getItem('theme') || 'cosmo';
    applyTheme(theme);

    const style = document.createElement('style');
    style.textContent = 'body { visibility: hidden; }';
    document.head.appendChild(style);

    window.addEventListener('load', function() {
        document.head.removeChild(style);
        document.body.style.visibility = 'visible';
    });
})();