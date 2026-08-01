// js/core/scroll-reveal.js

export function initScrollReveal() {
    console.log('Initializing Scroll Reveal...');
    
    // Chỉ áp dụng cho các section (không bao gồm hero)
    const sections = document.querySelectorAll('section:not(#home)');
    
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1)`;
        section.style.transitionDelay = `${index * 0.1}s`;
        section.classList.add('scroll-reveal');
    });
    
    // Observer để phát hiện khi phần tử vào viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                console.log('Revealed section:', entry.target.id || 'section');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe tất cả sections
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // =========================
    // HIỆU ỨNG CHO PRODUCT CARDS
    // =========================
    const grid = document.getElementById('product-grid');
    if (grid) {
        // Lắng nghe khi grid thay đổi
        const mutationObserver = new MutationObserver(() => {
            observeProductCards();
        });
        mutationObserver.observe(grid, { 
            childList: true, 
            subtree: false 
        });
        
        // Observe product cards
        function observeProductCards() {
            const cards = grid.querySelectorAll('.product-card:not(.observed)');
            console.log(`Observing ${cards.length} new product cards`);
            
            cards.forEach((card, index) => {
                card.classList.add('observed');
                
                // Đặt trạng thái ban đầu: ẨN
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px) scale(0.97)';
                card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1)`;
                card.style.transitionDelay = `${(index % 6) * 80}ms`;
                
                // Observer cho từng card
                const cardObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0) scale(1)';
                            cardObserver.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -30px 0px'
                });
                
                cardObserver.observe(card);
            });
        }
        
        // Observe lần đầu
        setTimeout(observeProductCards, 200);
    }
    
    // =========================
    // HIỆU ỨNG CHO HERO
    // =========================
    const hero = document.querySelector('#home');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(30px)';
        hero.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
            console.log('Hero revealed!');
        }, 400);
    }
    
    console.log('Scroll Reveal initialized!');
}

window.initScrollReveal = initScrollReveal;