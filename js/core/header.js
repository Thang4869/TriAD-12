// js/core/header.js

export function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) {
        console.warn('Header not found!');
        return;
    }
    
    console.log('Initializing Header (Sticky + Shrink)...');
    
    let ticking = false;
    let lastScroll = 0;
    
    function handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScroll > 60) {
            header.classList.add('header-shrink');
        } else {
            header.classList.remove('header-shrink');
        }
        
        // Cập nhật active menu
        updateActiveMenu(currentScroll);
        
        lastScroll = currentScroll;
        ticking = false;
    }
    
    // Cập nhật active menu item
    function updateActiveMenu(scrollY) {
        const sections = ['home', 'about', 'products', 'contact'];
        const navLinks = document.querySelectorAll('nav a, #mobile-menu a');
        let currentSection = 'home';
        const viewportHeight = window.innerHeight;
        
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= viewportHeight / 2 && rect.bottom >= viewportHeight / 2) {
                    currentSection = id;
                }
            }
        });
        
        // Cập nhật class active
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSection}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Optimize scroll với requestAnimationFrame
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Kiểm tra vị trí ban đầu
    setTimeout(() => handleScroll(), 100);
    
    console.log('Header initialized!');
}

window.initHeaderScroll = initHeaderScroll;