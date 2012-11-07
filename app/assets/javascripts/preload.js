window.onload = function() {
    try {
        localStorage.setItem('hui', 'pizda');
        localStorage.removeItem('hui');
    } catch (exception) {
        setTimeout(function() {
            var loading = document.getElementById('loading_container');
            var picture = document.getElementById('loading');
            var blockquote = loading.getElementsByTagName('blockquote')[0];
            loading.removeChild(picture);
            blockquote.style.color = "red";
            var link = blockquote.getElementsByTagName('a')[0]
            link.style.fontSize = "18px";
        }, 1000);
        return
    }
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = tachyonPath;
    document.head.appendChild(script);
}
