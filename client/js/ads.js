const Ads = {
    loadTopBanner: function() {
        const adScript = document.createElement('script');
        adScript.async = true;
        adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID';
        adScript.crossOrigin = 'anonymous';
        document.head.appendChild(adScript);

        const adElement = document.createElement('ins');
        adElement.className = 'adsbygoogle';
        adElement.style.display = 'block';
        adElement.setAttribute('data-ad-client', 'ca-pub-6563673001934226');
        adElement.setAttribute('data-ad-slot', '8580573535');
        adElement.setAttribute('data-ad-format', 'auto');
        adElement.setAttribute('data-full-width-responsive', 'true');

        $('#ad-banner-top').html('').append(adElement);

        (adsbygoogle = window.adsbygoogle || []).push({});
    }
};