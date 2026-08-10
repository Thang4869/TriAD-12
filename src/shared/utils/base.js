// (function setBase() {
//     const base = document.createElement('base');
//     const pathname = window.location.pathname;
//     const segments = pathname.split('/').filter(s => s.length > 0);
    
//     let baseHref = './';
    
//     if (segments.length === 0) {
//         // Root path, ví dụ: https://example.com/
//         baseHref = './';
//     } else if (segments[0] === 'pages') {
//         // Đang ở trang con (local), base là thư mục cha
//         baseHref = '../';
//     } else if (segments[0] === 'index.html' || segments[0] === '') {
//         baseHref = './';
//     } else {
//         // GitHub Pages: segments[0] là tên repository
//         baseHref = '/' + segments[0] + '/';
//     }
    
//     base.href = baseHref;
//     document.head.prepend(base);
// })();