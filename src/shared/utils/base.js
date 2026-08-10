(function setBase() {
    const base = document.createElement('base');
    const { hostname, pathname } = window.location;

    if (hostname.endsWith('github.io')) {
        const segments = pathname.split('/').filter(Boolean);
        base.href = segments.length > 0
            ? `/${segments[0]}/`
            : '/';
    } else {
        base.href = '/';
    }

    document.head.prepend(base);
})();