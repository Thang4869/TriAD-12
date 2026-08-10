(function setBase() {
    const base = document.createElement('base');
    const pathname = window.location.pathname;
    if (pathname.includes('/pages/')) {
        base.href = '../';
    } else {
        base.href = './';
    }

    document.head.prepend(base);
})();