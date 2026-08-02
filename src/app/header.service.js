/**
 * Header Service - Header scroll and navigation
 */
export function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) {
        console.warn('Header not found!');
        return;
    }
    
    console.log('Initializing Header...');
    
    let ticking = false;
    
    function handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        // Shrink header
        if (currentScroll > 60) {
            header.classList.add('header-shrink');
        } else {
            header.classList.remove('header-shrink');
        }
        
        // Update active menu
        updateActiveMenu(currentScroll);
        
        ticking = false;
    }
    
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
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSection}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Optimized scroll
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Initial check
    setTimeout(() => handleScroll(), 100);
    
    console.log('Header initialized!');
}