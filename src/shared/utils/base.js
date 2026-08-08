// src/utils/base.js
(function setBase() {
    var base = document.createElement('base');
    var path = window.location.pathname;
    // Nếu đang chạy trên GitHub Pages với subfolder /TriAD-12/
    if (path.startsWith('/TriAD-12/')) {
        base.href = '/TriAD-12/';
    } else {
        // Mặc định là root (dành cho localhost hoặc custom domain)
        base.href = '/';
    }
    document.head.appendChild(base);
})();