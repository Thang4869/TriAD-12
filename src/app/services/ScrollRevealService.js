import { Logger } from "../../core/services/Logger.js";

export function initScrollReveal() {
  Logger.debug("Initializing Scroll Reveal...");

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  if (
    prefersReducedMotion ||
    typeof window.IntersectionObserver !== "function"
  ) {
    Logger.debug("Scroll Reveal skipped; content remains visible.");
    return () => {};
  }

  const timers = new Set();
  const animatedElements = new Set();
  let sectionObserver = null;
  let cardObserver = null;
  let mutationObserver = null;
  let isCleanedUp = false;

  const schedule = (callback, delay) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!isCleanedUp) callback();
    }, delay);
    timers.add(timer);
    return timer;
  };

  const revealObserverEntry = (entry) => {
    if (!entry.isIntersecting) return;
    entry.target.style.opacity = "1";
    entry.target.style.transform = "translateY(0) scale(1)";
    const observer =
      entry.target.classList.contains("product-card")
        ? cardObserver
        : sectionObserver;
    observer?.unobserve(entry.target);
  };

  const hero = document.querySelector("#home");
  if (hero) {
    animatedElements.add(hero);
    hero.style.opacity = "0";
    hero.style.transform = "translateY(30px)";
    hero.style.transition = "opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1)";
    schedule(() => {
      hero.style.opacity = "1";
      hero.style.transform = "translateY(0)";
    }, 400);
  }

  const sections = document.querySelectorAll("section:not(#home)");
  if (sections.length > 0) {
    sectionObserver = new IntersectionObserver(
      (entries) => entries.forEach(revealObserverEntry),
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );

    sections.forEach((section, index) => {
      animatedElements.add(section);
      section.style.opacity = "0";
      section.style.transform = "translateY(50px)";
      section.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      section.style.transitionDelay = `${index * 0.1}s`;
      section.classList.add("scroll-reveal");
      sectionObserver.observe(section);
    });
  }

  const grid = document.getElementById("product-grid");
  if (grid) {
    const observeProductCards = () => {
      const cards = grid.querySelectorAll(".product-card:not(.observed)");
      if (cards.length === 0) return;

      if (!cardObserver) {
        cardObserver = new IntersectionObserver(
          (entries) => entries.forEach(revealObserverEntry),
          { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
        );
      }

      cards.forEach((card, index) => {
        animatedElements.add(card);
        card.classList.add("observed");
        card.style.opacity = "0";
        card.style.transform = "translateY(30px) scale(0.97)";
        card.style.transition = "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
        card.style.transitionDelay = `${(index % 6) * 80}ms`;
        cardObserver.observe(card);
      });
    };

    mutationObserver = new MutationObserver(observeProductCards);
    mutationObserver.observe(grid, { childList: true, subtree: false });
    schedule(observeProductCards, 200);
  }

  Logger.debug("Scroll Reveal initialized!");

  return () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    timers.forEach(clearTimeout);
    timers.clear();
    sectionObserver?.disconnect();
    cardObserver?.disconnect();
    mutationObserver?.disconnect();

    animatedElements.forEach((element) => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      element.style.removeProperty("transition");
      element.style.removeProperty("transition-delay");
      element.classList.remove("scroll-reveal", "observed");
    });
    animatedElements.clear();
  };
}
