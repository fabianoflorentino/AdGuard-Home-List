(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------------- *
   * Matrix rain
   * ---------------------------------------------------------------- */
  const canvas = document.getElementById("matrix");

  if (canvas && !reduceMotion.matches) {
    const ctx = canvas.getContext("2d");
    const glyphs =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/\\|=+*#$%&@";
    const fontSize = 16;
    const frameMs = 55;

    let width = 0;
    let height = 0;
    let columns = 0;
    let drops = [];
    let lastFrame = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.max(1, Math.floor(width / fontSize));
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * (height / fontSize)),
      );
    };

    const draw = (time) => {
      if (time - lastFrame < frameMs) {
        requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;

      ctx.fillStyle = "rgba(5, 7, 10, 0.09)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px "Share Tech Mono", monospace`;

      for (let i = 0; i < columns; i += 1) {
        const char = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle =
          Math.random() > 0.985
            ? "rgba(255, 43, 214, 0.85)"
            : Math.random() > 0.9
              ? "rgba(0, 229, 255, 0.8)"
              : "rgba(0, 255, 156, 0.75)";

        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += 1;
        }
      }

      requestAnimationFrame(draw);
    };

    let resizeTimer;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });

    resize();
    requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------------- *
   * Live counters from badge JSON
   * ---------------------------------------------------------------- */
  const animateNumber = (element, target) => {
    if (reduceMotion.matches) {
      element.textContent = new Intl.NumberFormat("en-US").format(target);
      return;
    }

    const duration = 1100;
    const start = performance.now();
    const formatter = new Intl.NumberFormat("en-US");

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter.format(Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  const loadCounts = async () => {
    const targets = {
      allow: document.querySelector('[data-list="allow"]'),
      block: document.querySelector('[data-list="block"]'),
    };

    const files = {
      allow: "badge-allow.json",
      block: "badge-block.json",
    };

    await Promise.all(
      Object.keys(files).map(async (key) => {
        const element = targets[key];
        if (!element) return;

        try {
          const response = await fetch(new URL(files[key], window.location.href), {
            cache: "no-store",
          });
          if (!response.ok) return;

          const data = await response.json();
          const value = Number(String(data.message || "").replace(/,/g, ""));
          if (Number.isFinite(value) && value > 0) {
            animateNumber(element, value);
          }
        } catch {
          /* keep the placeholder when the badge is unavailable */
        }
      }),
    );
  };

  loadCounts();

  /* ---------------------------------------------------------------- *
   * Copy to clipboard
   * ---------------------------------------------------------------- */
  const toast = document.getElementById("toast");
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  };

  const fallbackCopy = (text) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }

    document.body.removeChild(area);
    return ok;
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "";
      let copied = false;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
          copied = true;
        }
      } catch {
        copied = false;
      }

      if (!copied) {
        copied = fallbackCopy(value);
      }

      if (copied) {
        const original = button.textContent;
        button.textContent = "Copied";
        button.classList.add("is-copied");
        showToast("URL copied to clipboard");
        window.setTimeout(() => {
          button.textContent = original;
          button.classList.remove("is-copied");
        }, 1800);
      } else {
        showToast("Press Ctrl+C to copy");
      }
    });
  });

  /* ---------------------------------------------------------------- *
   * Scroll reveal
   * ---------------------------------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  /* ---------------------------------------------------------------- *
   * Footer year
   * ---------------------------------------------------------------- */
  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
