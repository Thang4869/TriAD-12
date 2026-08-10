/**
 * Header Service - Header scroll and navigation
 */
import { logger } from '../shared/services/logger.service.js';

export function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) {
        logger.warn('Header not found!');
        return;
    }
    
    logger.debug('Initializing Header...');
    
    function handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        header.classList.toggle(
            'header-shrink',
            currentScroll > 60
        );
        
        ticking = false;
    }

    let ticking = false;
    
    // Optimized scroll
    window.addEventListener('scroll', () => {
        if (!ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(handleScroll);
    });
    
    // Initial check
    handleScroll();
    
    logger.debug('Header initialized!');
}