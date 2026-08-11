import { Logger } from '../core/services/Logger.js';

export function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) {
        Logger.warn('Header not found!');
        return;
    }

    Logger.debug('Initializing Header...');

    function handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        header.classList.toggle(
            'header-shrink',
            currentScroll > 60
        );

        ticking = false;
    }

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(handleScroll);
    });

    handleScroll();

    Logger.debug('Header initialized!');
}