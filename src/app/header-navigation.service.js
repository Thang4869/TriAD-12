const PAGE_HREF_MAP = {
    home: 'index.html',
    about: 'about.html',
    products: 'products.html',
    blog: 'blog.html',
    'blog-detail': 'blog.html',
    reviews: 'reviews.html',
    location: 'location.html',
    contact: 'contact.html'
};

function normalizePath(href) {
    if (!href) {
        return '';
    }

    const url = new URL(href, window.location.href);

    return url.pathname
        .replace(/^\/+/, '')
        .replace(/^TriAD-12\//, '');
}

export function initHeaderNavigation(currentPage) {
    const menuLinks = document.querySelectorAll(
        'nav a, #mobile-menu a'
    );

    if (!menuLinks.length) {
        console.warn('Header navigation links not found.');
        return;
    }

    const activePage = PAGE_HREF_MAP[currentPage];

    if (!activePage) {
        return;
    }

    menuLinks.forEach(link => {
        const linkPath = normalizePath(link.getAttribute('href'));

        link.classList.toggle(
            'active',
            linkPath === activePage
        );
    });
}