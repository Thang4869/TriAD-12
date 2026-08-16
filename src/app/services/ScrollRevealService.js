import { Logger } from "../../core/services/Logger.js";

export function initScrollReveal() {
  Logger.debug("Initializing Scroll Reveal...");

  const hero = document.querySelector("#home");
  if (hero) {
    hero.style.opacity = "0";
    hero.style.transform = "translateY(30px)";
    hero.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)";
    setTimeout(() => {
      hero.style.opacity = "1";
      hero.style.transform = "translateY(0)";
    }, 400);
  }

  const sections = document.querySelectorAll("section:not(#home)");
  sections.forEach((section, index) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(50px)";
    section.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1)`;
    section.style.transitionDelay = `${index * 0.1}s`;
    section.classList.add("scroll-reveal");
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

  const grid = document.getElementById("product-grid");
  if (grid) {
    const mutationObserver = new MutationObserver(() => {
      observeProductCards();
    });
    mutationObserver.observe(grid, { childList: true, subtree: false });

    function observeProductCards() {
      const cards = grid.querySelectorAll(".product-card:not(.observed)");
      cards.forEach((card, index) => {
        card.classList.add("observed");
        card.style.opacity = "0";
        card.style.transform = "translateY(30px) scale(0.97)";
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1)`;
        card.style.transitionDelay = `${(index % 6) * 80}ms`;

        const cardObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0) scale(1)";
                cardObserver.unobserve(entry.target);
              }
            });
          },
          {
            threshold: 0.1,
            rootMargin: "0px 0px -30px 0px",
          },
        );

        cardObserver.observe(card);
      });
    }

    setTimeout(observeProductCards, 200);
  }

  Logger.debug("Scroll Reveal initialized!");
}
