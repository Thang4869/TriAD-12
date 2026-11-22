import { Logger } from "../../core/services/Logger.js";

export function initScrollReveal() {
  Logger.debug("Initializing Scroll Reveal...");

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  if (
    prefersReducedMotion ||
    typeof window.IntersectionObserver !== "function"
  ) {
    Logger.debug("Scroll Reveal skipped; content remains visible.");
    return () => {};
  }

  const timers = new Set();
  const originalElementStates = new Map();
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

  const trackElement = (element) => {
    if (originalElementStates.has(element)) return;
    originalElementStates.set(element, {
      style: element.getAttribute("style"),
      hadScrollReveal: element.classList.contains("scroll-reveal"),
      hadObserved: element.classList.contains("observed"),
    });
  };

  const revealObserverEntry = (entry) => {
    if (!entry.isIntersecting) return;
    entry.target.style.opacity = "1";
    const isProductCard = entry.target.classList.contains("product-card");
    entry.target.style.transform = isProductCard
      ? "translateY(0) scale(1)"
      : "translateY(0)";
    const observer = isProductCard ? cardObserver : sectionObserver;
    observer?.unobserve(entry.target);
  };

  const hero = document.querySelector("#home");
// Keep the hero visible immediately to avoid delaying Largest Contentful Paint.

  const sections = document.querySelectorAll("section:not(#home)");
  sectionObserver = new IntersectionObserver(
    (entries) => entries.forEach(revealObserverEntry),
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
  );

  sections.forEach((section, index) => {
    trackElement(section);
    section.style.opacity = "0";
    section.style.transform = "translateY(50px)";
    section.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    section.style.transitionDelay = `${index * 0.1}s`;
    section.classList.add("scroll-reveal");
    sectionObserver.observe(section);
  });

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
        trackElement(card);
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

    originalElementStates.forEach((original, element) => {
      if (original.style === null) {
        element.removeAttribute("style");
      } else {
        element.setAttribute("style", original.style);
      }
      if (!original.hadScrollReveal) element.classList.remove("scroll-reveal");
      if (!original.hadObserved) element.classList.remove("observed");
    });
    originalElementStates.clear();
  };
}
