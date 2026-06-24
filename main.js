/**
 * Portfolio — Main JavaScript (ES Module)
 * Handles scroll animations, hamburger menu, counter animations,
 * floating particles, Lenis smooth scroll, and Spline 3D background.
 */

import { Application } from 'https://esm.sh/@splinetool/runtime';
import Lenis from 'https://esm.sh/lenis';
import gsap from 'https://esm.sh/gsap';
import ScrollTrigger from 'https://esm.sh/gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// SMOOTH SCROLLING (Lenis) & SCROLL-DRIVEN 3D ZOOM
// ============================================================
let lenis;

function initLenisAndScrollEffects() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  // Make lenis globally accessible for other handlers
  window.lenis = lenis;

  // Sync Lenis with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // 1. 3D Canvas Scroll Animation: Zoom in and fade to grey (Desktop only)
  let mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    gsap.to('#spline-canvas', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      scale: 1.5,
      opacity: 0,
      ease: 'none'
    });
  });

}

// ============================================================
// SPLINE 3D BACKGROUND INITIALIZATION
// ============================================================
function initSpline3D() {
  const canvas = document.getElementById('spline-canvas');
  const loader = document.getElementById('spline-loader');

  if (!canvas) {
    console.warn('[Portfolio] Spline canvas not found.');
    return;
  }

  // Safety Timeout Fallback: If Spline takes more than 6s, fade out the loader anyway
  const timeoutId = setTimeout(() => {
    if (loader && !loader.classList.contains('fade-out')) {
      console.warn('[Portfolio] Spline load timeout. Fading out loader to show fallback page.');
      loader.classList.add('fade-out');
    }
  }, 6000);

  const spline = new Application(canvas);

  spline.load('https://prod.spline.design/2LMNhlZccuyiAkmo/scene.splinecode')
    .then(() => {
      console.log('[Portfolio] Spline 3D background loaded successfully.');
      clearTimeout(timeoutId);

      // Hide loader overlay
      if (loader) {
        loader.classList.add('fade-out');
      }

      // Initialize spline compatibility mode
      if (window.initSplineBackground) {
        window.initSplineBackground(spline, { interactive: false });
      }
    })
    .catch((error) => {
      console.error('[Portfolio] Failed to load Spline scene:', error);
      clearTimeout(timeoutId);

      // Fallback: hide loader so user can see the website
      if (loader) {
        loader.classList.add('fade-out');
      }
    });
}

// ============================================================
// SCROLL ANIMATIONS — Intersection Observer
// ============================================================
function initScrollAnimations() {
  const elements = document.querySelectorAll('.slide-up-and-fade');

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// ============================================================
// HAMBURGER MENU
// ============================================================
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const menuOverlay = document.getElementById('menu-overlay');
  const menuItems = document.querySelectorAll('.menu-item[data-target]');

  if (!hamburgerBtn) return;

  function toggleMenu() {
    document.body.classList.toggle('menu-open');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
  }

  hamburgerBtn.addEventListener('click', toggleMenu);
  menuOverlay.addEventListener('click', closeMenu);

  // Menu item navigation
  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        closeMenu();
        // Small delay to let menu close animation start
        setTimeout(() => {
          if (lenis) {
            lenis.scrollTo(targetSection);
          } else {
            targetSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      closeMenu();
    }
  });
}

// ============================================================
// COUNTER ANIMATION (hero stats)
// ============================================================
function initCounterAnimation() {
  const counters = document.querySelectorAll('.counter');

  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-target'), 10);
          animateCounter(counter, target);
          observer.unobserve(counter);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(element, target) {
  const duration = 2000; // 2 seconds
  const startTime = performance.now();
  const startValue = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startValue + (target - startValue) * eased);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

// ============================================================
// FLOATING PARTICLES (ambient background dots)
// ============================================================
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';

    // Random size (2-4px)
    const size = 2 + Math.random() * 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    // Random animation duration (15-40s)
    const duration = 15 + Math.random() * 25;
    particle.style.animationDuration = duration + 's';

    // Random delay
    particle.style.animationDelay = Math.random() * duration + 's';

    // Random opacity
    particle.style.opacity = 0.05 + Math.random() * 0.15;

    container.appendChild(particle);
  }
}

// ============================================================
// CURRENT YEAR (footer)
// ============================================================
function initCurrentYear() {
  const el = document.getElementById('current-year');
  if (el) {
    el.textContent = new Date().getFullYear();
  }
}

// ============================================================
// SPLINE COMPATIBILITY HOOKS (window hooks for custom models)
// ============================================================
window.initSplineBackground = function (splineApp, options = {}) {
  const container = document.getElementById('spline-bg');
  if (!container) return;

  if (options.interactive) {
    container.classList.add('interactive');
  }

  // Hide the fallback particles when Spline is successfully loaded
  const particles = document.getElementById('particles');
  if (particles) {
    particles.style.display = 'none';
  }
};

window.initSplineText = function (placeholderEl) {
  if (!placeholderEl) return;
  placeholderEl.classList.add('spline-loaded');
};

// ============================================================
// SMOOTH SCROLL for anchor links (fallback/extra links)
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').substring(1);
      const targetEl = document.getElementById(targetId);

      if (targetEl) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(targetEl);
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  initLenisAndScrollEffects();
  initSpline3D();
  initScrollAnimations();
  initHamburgerMenu();
  initCounterAnimation();
  initParticles();
  initCurrentYear();
  initSmoothScroll();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
