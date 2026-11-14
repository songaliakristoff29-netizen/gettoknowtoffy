const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const year = document.getElementById("year");
const siteMusic = document.getElementById("site-music");
const musicPositionKey = "site-music-position";
const interestHoverTimers = new Map();
const journeyHoverTimers = new Map();
let revealObserver = null;

function saveMusicPosition() {
  if (!siteMusic || !Number.isFinite(siteMusic.currentTime)) return;
  try {
    sessionStorage.setItem(musicPositionKey, String(siteMusic.currentTime));
  } catch {}
}

if (siteMusic) {
  siteMusic.volume = 0.3;

  const retryAutoplay = () => {
    siteMusic.play().catch(() => {});
  };
  const removeRetryListeners = () => {
    document.removeEventListener("pointerdown", retryAutoplay);
    document.removeEventListener("keydown", retryAutoplay);
  };

  const startMusic = () => {
    try {
      const savedPosition = Number(sessionStorage.getItem(musicPositionKey));
      if (savedPosition > 0 && Number.isFinite(savedPosition)) {
        const duration = siteMusic.duration;
        siteMusic.currentTime = Number.isFinite(duration) && duration > 0
          ? savedPosition % duration
          : savedPosition;
      }
    } catch {}

    siteMusic.play().catch(() => {
      document.addEventListener("pointerdown", retryAutoplay, { once: true });
      document.addEventListener("keydown", retryAutoplay, { once: true });
    });
  };

  siteMusic.addEventListener("play", removeRetryListeners, { once: true });
  siteMusic.addEventListener("timeupdate", saveMusicPosition);
  window.addEventListener("pagehide", saveMusicPosition);

  if (siteMusic.readyState >= 1) {
    startMusic();
  } else {
    siteMusic.addEventListener("loadedmetadata", startMusic, { once: true });
    siteMusic.load();
  }
}

function clearInterestCard(card) {
  const timer = interestHoverTimers.get(card);
  if (timer) window.clearTimeout(timer);
  interestHoverTimers.delete(card);
  card.classList.remove("is-expanded", "is-hover-expanded");

  const toggleButton = card.querySelector(".card-toggle");
  if (toggleButton) {
    toggleButton.textContent = "More details";
    toggleButton.setAttribute("aria-expanded", "false");
  }

  if (card.contains(document.activeElement)) {
    document.activeElement.blur();
  }
}

function closeOtherInterestCards(activeCard) {
  document.querySelectorAll(".interest-card").forEach((card) => {
    if (card !== activeCard) clearInterestCard(card);
  });
}

function initializeInterestCards() {
  document.querySelectorAll(".interest-card").forEach((card) => {
    const toggleButton = card.querySelector(".card-toggle");
    const clickToEnableHover = card.closest(".hobbies-page");

    if (clickToEnableHover) {
      card.addEventListener("click", () => {
        card.classList.add("is-armed", "is-hover-expanded");
      });
    }

    card.addEventListener("pointerenter", () => {
      closeOtherInterestCards(card);
      if (clickToEnableHover && !card.classList.contains("is-armed")) return;
      const existingTimer = interestHoverTimers.get(card);
      if (existingTimer) window.clearTimeout(existingTimer);

      const timer = window.setTimeout(() => {
        card.classList.add("is-hover-expanded");
        interestHoverTimers.delete(card);
      }, 450);
      interestHoverTimers.set(card, timer);
    });

    card.addEventListener("pointerleave", () => {
      clearInterestCard(card);
    });

    toggleButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      closeOtherInterestCards(card);
      const isExpanded = card.classList.toggle("is-expanded");
      toggleButton.textContent = isExpanded ? "Hide details" : "More details";
      toggleButton.setAttribute("aria-expanded", String(isExpanded));
      const timer = interestHoverTimers.get(card);
      if (timer) window.clearTimeout(timer);
      interestHoverTimers.delete(card);
    });
  });
}

function initializeJourneyCards() {
  let pinnedCard = null;

  document.querySelectorAll(".timeline-item").forEach((card) => {
    const summary = card.querySelector("summary");
    if (!summary) return;

    card.addEventListener("pointerenter", () => {
      if (pinnedCard && pinnedCard !== card) {
        pinnedCard.open = false;
        pinnedCard.removeAttribute("data-pinned");
        pinnedCard.classList.remove("is-hover-expanded");
        pinnedCard = null;
      }

      const timer = window.setTimeout(() => {
        card.open = true;
        card.classList.add("is-hover-expanded");
        journeyHoverTimers.delete(card);
      }, 2000);
      journeyHoverTimers.set(card, timer);
    });

    card.addEventListener("pointerleave", () => {
      const timer = journeyHoverTimers.get(card);
      if (timer) window.clearTimeout(timer);
      journeyHoverTimers.delete(card);
      card.classList.remove("is-hover-expanded");

      if (!card.hasAttribute("data-pinned") && !card.contains(document.activeElement)) {
        card.open = false;
      }
    });

    card.addEventListener("focusin", () => {
      card.open = true;
    });

    card.addEventListener("focusout", (event) => {
      if (!card.hasAttribute("data-pinned") && !card.contains(event.relatedTarget)) {
        card.open = false;
      }
    });

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      const timer = journeyHoverTimers.get(card);
      if (timer) window.clearTimeout(timer);
      journeyHoverTimers.delete(card);
      card.classList.remove("is-hover-expanded");

      if (card.hasAttribute("data-pinned")) {
        card.removeAttribute("data-pinned");
        card.open = false;
        if (pinnedCard === card) pinnedCard = null;
        return;
      }

      if (pinnedCard && pinnedCard !== card) {
        pinnedCard.open = false;
        pinnedCard.removeAttribute("data-pinned");
        pinnedCard.classList.remove("is-hover-expanded");
      }
      card.setAttribute("data-pinned", "");
      card.open = true;
      pinnedCard = card;
    });
  });
}

function initializeLoveCardPopups() {
  const closePopup = (card) => {
    card.getAnimations().forEach((animation) => animation.cancel());
    card.classList.remove("is-popup-open");
    card.style.removeProperty("left");
    card.style.removeProperty("top");
    card.style.removeProperty("transform");
    card.style.removeProperty("transform-origin");
  };

  document.querySelectorAll(".love-card").forEach((card) => {
    card.addEventListener("click", () => {
      const shouldOpen = !card.classList.contains("is-popup-open");
      document.querySelectorAll(".love-card.is-popup-open").forEach((openCard) => {
        closePopup(openCard);
      });
      if (!shouldOpen) return;
      const origin = card.getBoundingClientRect();
      card.classList.add("is-popup-open");
      const destination = card.getBoundingClientRect();
      card.style.left = `${destination.left}px`;
      card.style.top = `${destination.top}px`;
      card.style.transform = "none";
      card.style.transformOrigin = "top left";
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const animation = card.animate(
        [
          {
            transform: `translate(${origin.left - destination.left}px, ${origin.top - destination.top}px) scale(${origin.width / destination.width}, ${origin.height / destination.height})`,
          },
          { transform: "none" },
        ],
        {
          duration: reduceMotion ? 0 : 700,
          easing: "cubic-bezier(.4, 0, .2, 1)",
        }
      );
      animation.onfinish = () => {
        if (!card.classList.contains("is-popup-open")) return;
        animation.cancel();
        card.style.transform = "none";
      };
    });

  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest(".love-card.is-popup-open")) return;
  document.querySelectorAll(".love-card.is-popup-open").forEach((card) => {
    card.getAnimations().forEach((animation) => animation.cancel());
    card.classList.remove("is-popup-open");
    card.style.removeProperty("left");
    card.style.removeProperty("top");
    card.style.removeProperty("transform");
    card.style.removeProperty("transform-origin");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".love-card.is-popup-open").forEach((card) => {
    card.getAnimations().forEach((animation) => animation.cancel());
    card.classList.remove("is-popup-open");
    card.style.removeProperty("left");
    card.style.removeProperty("top");
    card.style.removeProperty("transform");
    card.style.removeProperty("transform-origin");
  });
});

if (year) year.textContent = new Date().getFullYear();

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
}

function initializeReveals() {
  revealObserver?.disconnect();
  const revealItems = document.querySelectorAll(
    ".section-heading, .about-grid, .interest-card, .timeline-item, .goals-inner, .contact-section > *"
  );
  revealItems.forEach((item) => item.classList.add("reveal"));

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("visible"));
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

function updateActiveNavigation(url) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    const target = new URL(link.href, window.location.href);
    link.classList.toggle("active", target.pathname === url.pathname);
  });
}

async function navigateWithoutReload(url, addHistory = true) {
  try {
    const response = await fetch(url.pathname + url.search, { headers: { Accept: "text/html" } });
    if (!response.ok) throw new Error(`Page request failed: ${response.status}`);

    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const currentMain = document.querySelector("main");
    const nextMain = page.querySelector("main");
    if (!currentMain || !nextMain) throw new Error("Page content is missing.");

    currentMain.querySelectorAll(".interest-card").forEach(clearInterestCard);
    currentMain.replaceChildren(...Array.from(nextMain.childNodes));
    updateMusicButtons();
    document.title = page.title;
    if (addHistory) window.history.pushState({}, "", url.pathname + url.search + url.hash);
    updateActiveNavigation(url);
    navLinks?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    initializeInterestCards();
    initializeJourneyCards();
    initializeLoveCardPopups();
    initializeReveals();

    if (url.hash) {
      requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  } catch {
    if (addHistory) window.location.assign(url.href);
    else window.location.reload();
  }
}

document.addEventListener("click", (event) => {
  const target = event.target;
  const link = target instanceof Element ? target.closest("a[href]") : null;
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;

  const url = new URL(link.href, window.location.href);
  const isLocalPage = url.origin === window.location.origin && url.pathname.endsWith(".html");
  if (!isLocalPage) return;

  event.preventDefault();
  if (navLinks?.contains(link)) {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    if (url.hash) {
      if (url.hash !== window.location.hash) {
        window.history.pushState({}, "", url.pathname + url.search + url.hash);
      }
      document.querySelector(url.hash)?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    return;
  }
  navigateWithoutReload(url);
});

window.addEventListener("popstate", () => {
  navigateWithoutReload(new URL(window.location.href), false);
});

updateActiveNavigation(new URL(window.location.href));
initializeInterestCards();
initializeJourneyCards();
initializeLoveCardPopups();
initializeReveals();
