(function setBase() {
    const base = document.createElement('base');
    const pathname = window.location.pathname;
    
    // Kiểm tra nếu đang ở trang con (pages/)
    if (pathname.includes('/pages/')) {
        base.href = '../';
    } else {
        // Nếu đang ở root hoặc GitHub Pages subpath
        const segments = pathname.split('/').filter(s => s.length > 0);
        if (segments.length > 1) {
            // GitHub Pages: /TriAD-12/ -> base href = /TriAD-12/
            base.href = '/' + segments[0] + '/';
        } else {
            base.href = './';
        }
    }
    
    document.head.prepend(base);
})();