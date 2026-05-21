document.documentElement.classList.add("is-ready");

const imageExtensions = ["webp", "jpg", "jpeg", "png"];
const sideNav = document.querySelector(".side-nav");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenuQuery = window.matchMedia("(max-width: 900px)");
const animatedElements = document.querySelectorAll(
  ".hero-copy, .inquiry-hero-copy, .news-heading, .news-card, .concept-inner, .activity-heading, .activity-card, .movie-heading, .movie-card, .category-hero, .category-list a, .category-note, .category-page-heading, .category-index-panel a, .category-search-card, .content-page-heading, .content-panel, .contact-heading, .contact-form, .footer-nav, .footer-logo"
);

const setMenuOpen = (isOpen) => {
  if (!sideNav || !menuToggle) {
    return;
  }

  sideNav.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("is-menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
};

if (sideNav && menuToggle) {
  menuToggle.addEventListener("click", () => {
    setMenuOpen(!sideNav.classList.contains("is-open"));
  });

  sideNav.querySelectorAll(".nav-link, .contact-button").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMenuQuery.matches) {
        setMenuOpen(false);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });

  mobileMenuQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      setMenuOpen(false);
    }
  });
}

animatedElements.forEach((element, index) => {
  element.dataset.animate = "";
  element.style.setProperty("--stagger", `${Math.min(index % 6, 5) * 70}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.15,
    }
  );

  animatedElements.forEach((element) => revealObserver.observe(element));
} else {
  animatedElements.forEach((element) => element.classList.add("is-visible"));
}

document.querySelectorAll("[data-image-base]").forEach((holder) => {
  const image = holder.querySelector("img");
  const baseName = holder.dataset.imageBase;
  let extensionIndex = 0;

  if (!image || !baseName) {
    return;
  }

  const tryNextImage = () => {
    if (extensionIndex >= imageExtensions.length) {
      image.removeAttribute("src");
      holder.classList.remove("is-loaded");
      return;
    }

    image.src = `image/${baseName}.${imageExtensions[extensionIndex]}`;
    extensionIndex += 1;
  };

  image.addEventListener("load", () => {
    holder.classList.add("is-loaded");
  });

  image.addEventListener("error", tryNextImage);
  tryNextImage();
});

document.querySelectorAll("[data-news-slider], [data-card-slider]").forEach((slider) => {
  const track = slider.querySelector("[data-slider-track]");
  const prevButton = slider.querySelector("[data-slider-prev]");
  const nextButton = slider.querySelector("[data-slider-next]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!track || !prevButton || !nextButton) {
    return;
  }

  const originalItems = Array.from(track.children);
  originalItems.forEach((item) => {
    const clone = item.cloneNode(true);

    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a, button").forEach((focusable) => {
      focusable.tabIndex = -1;
    });
    clone.querySelectorAll("[data-image-base]").forEach((holder) => {
      holder.classList.add("is-loaded");
    });
    track.appendChild(clone);
  });

  const getStep = () => {
    const firstCard = track.firstElementChild;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;

    return firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const getLoopWidth = () => {
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;

    return originalItems.reduce((width, item) => width + item.getBoundingClientRect().width, 0) + gap * originalItems.length;
  };

  let loopWidth = getLoopWidth();
  let isPaused = false;
  let lastFrameTime = null;

  const normalizeScroll = () => {
    if (!loopWidth) {
      loopWidth = getLoopWidth();
    }

    if (track.scrollLeft >= loopWidth) {
      track.scrollLeft -= loopWidth;
    } else if (track.scrollLeft < 0) {
      track.scrollLeft += loopWidth;
    }
  };

  prevButton.addEventListener("click", () => {
    if (track.scrollLeft <= 2) {
      track.scrollLeft += loopWidth;
    }

    track.scrollBy({ left: -getStep(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    track.scrollBy({ left: getStep(), behavior: "smooth" });
  });

  const autoScroll = (time) => {
    if (lastFrameTime === null) {
      lastFrameTime = time;
    }

    const elapsed = time - lastFrameTime;
    lastFrameTime = time;

    if (!isPaused && !prefersReducedMotion) {
      track.scrollLeft += (elapsed / 1000) * 22;
      normalizeScroll();
    }

    requestAnimationFrame(autoScroll);
  };

  track.addEventListener("scroll", normalizeScroll, { passive: true });
  slider.addEventListener("pointerenter", () => {
    isPaused = true;
  });
  slider.addEventListener("pointerleave", () => {
    isPaused = false;
  });
  slider.addEventListener("focusin", () => {
    isPaused = true;
  });
  slider.addEventListener("focusout", () => {
    isPaused = false;
  });
  window.addEventListener("resize", () => {
    loopWidth = getLoopWidth();
    normalizeScroll();
  });
  requestAnimationFrame(autoScroll);
});

document.querySelectorAll("[data-faq-list]").forEach((faqList) => {
  faqList.querySelectorAll(".faq-item button").forEach((button) => {
    button.addEventListener("click", () => {
      const currentItem = button.closest(".faq-item");
      const answerId = button.getAttribute("aria-controls");
      const answer = answerId ? document.getElementById(answerId) : null;
      const willOpen = button.getAttribute("aria-expanded") !== "true";

      faqList.querySelectorAll(".faq-item").forEach((item) => {
        const itemButton = item.querySelector("button");
        const itemAnswerId = itemButton?.getAttribute("aria-controls");
        const itemAnswer = itemAnswerId ? document.getElementById(itemAnswerId) : null;

        item.classList.remove("is-open");
        itemButton?.setAttribute("aria-expanded", "false");

        if (itemAnswer) {
          itemAnswer.hidden = true;
        }
      });

      if (currentItem && answer && willOpen) {
        currentItem.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        answer.hidden = false;
      }
    });
  });
});
