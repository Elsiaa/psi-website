/* ============================================================
   PSI — funnel behaviour (homepage, landing pages, contact)
   - Nav: transparent over image hero, solid after (pages without
     the scrub hero; hero.js/main.js not loaded here)
   - Quick lead form -> pre-filled email to info@psiconstructionpa.com
   - Before/after drag slider
   - Light scroll reveals, reduced-motion aware
   ============================================================ */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------- Nav ----------------
  const nav = document.getElementById("topNav");
  if (nav && !nav.classList.contains("nav--static")) {
    const scrubHero = document.getElementById("hero");   // scroll-controlled opener
    const imgHero = document.querySelector(".fhero");    // static-image hero (landing pages)
    const onScroll = () => {
      if (scrubHero) {
        const threshold = scrubHero.offsetHeight - window.innerHeight * 0.5;
        const runway = Math.max(1, scrubHero.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / runway));
        nav.classList.toggle("nav--solid", window.scrollY > threshold);
        // Past mid-scrub the frame behind the logo is light — switch marks.
        nav.classList.toggle("nav--darklogo", progress >= 0.5);
      } else {
        const threshold = imgHero ? imgHero.offsetHeight - 80 : 40;
        const solid = window.scrollY > threshold;
        nav.classList.toggle("nav--solid", solid);
        nav.classList.toggle("nav--darklogo", solid || !imgHero);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---------------- Construction motion triggers ----------------
  // chalk line snap / tape extend / level settle / nailed panel seat —
  // one-shot classes; CSS neutralises them under reduced motion.
  const oneShot = [
    [".chalk", "is-snapped", null],
    [".tape", "is-out", null],
    [".level", "is-level", (el) => {
      const steps = el.closest(".fsection") && el.closest(".fsection").querySelector(".steps");
      if (steps) setTimeout(() => steps.classList.add("is-set"), reducedMotion ? 0 : 480);
    }],
    [".nailed", "is-seated", null]
  ];
  if ("IntersectionObserver" in window) {
    oneShot.forEach(([sel, cls, extra]) => {
      const els = document.querySelectorAll(sel);
      if (!els.length) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add(cls);
            if (extra) extra(en.target);
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
      els.forEach((el) => io.observe(el));
    });
  } else {
    oneShot.forEach(([sel, cls, extra]) => {
      document.querySelectorAll(sel).forEach((el) => { el.classList.add(cls); if (extra) extra(el); });
    });
  }

  // ---------------- Scroll reveals ----------------
  const revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
  } else {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in-view"); ro.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    revealEls.forEach((el) => ro.observe(el));
  }

  // ---------------- Quick lead form ----------------
  document.querySelectorAll("form.lead").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (name) => (form.elements[name] ? form.elements[name].value.trim() : "");
      const need = v("need"), where = v("where"), when = v("when"),
            notes = v("notes"), name = v("name"), phone = v("phone"), email = v("email");

      const err = form.querySelector(".lead__error");
      if (!need || !name || !phone) {
        if (err) {
          err.textContent = "Please fill in what you need, your name, and a phone number.";
          err.hidden = false;
        }
        return;
      }
      if (err) err.hidden = true;

      const subject = `Quote request — ${need}${where ? " in " + where : ""}`;
      const body = [
        "New quote request from psiconstructionpa website",
        "",
        `What they need:  ${need}`,
        `Project location: ${where || "—"}`,
        `Timeline:         ${when || "—"}`,
        "",
        `Notes: ${notes || "—"}`,
        "",
        `Name:  ${name}`,
        `Phone: ${phone}`,
        `Email: ${email || "—"}`
      ].join("\n");

      window.location.href = "mailto:info@psiconstructionpa.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      const done = form.querySelector(".lead__done");
      if (done) done.hidden = false;
    });
  });

  // ---------------- Before / after slider ----------------
  document.querySelectorAll(".ba").forEach((ba) => {
    const frame = ba.querySelector(".ba__frame");
    const before = ba.querySelector(".ba__img--before");
    const after = ba.querySelector(".ba__img--after");
    const tabsWrap = ba.querySelector(".ba__tabs");
    const caption = ba.querySelector(".ba__caption");
    if (!frame || !before || !after) return;

    let sets = [];
    try { sets = JSON.parse(ba.dataset.sets || "[]"); } catch (e) { /* no sets */ }

    let pos = 50;
    const setPos = (pct) => {
      pos = Math.min(96, Math.max(4, pct));
      frame.style.setProperty("--ba-pos", pos + "%");
    };

    const loadSet = (i) => {
      const s = sets[i];
      if (!s) return;
      before.src = s.b; after.src = s.a;
      before.alt = "Before — " + s.cap; after.alt = "After — " + s.cap;
      if (caption) caption.textContent = s.cap;
      if (tabsWrap) tabsWrap.querySelectorAll(".ba__tab").forEach((b, j) =>
        b.classList.toggle("is-active", j === i));
      setPos(50);
    };

    if (tabsWrap && sets.length > 1) {
      sets.forEach((s, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ba__tab";
        b.textContent = s.label;
        b.addEventListener("click", () => loadSet(i));
        tabsWrap.appendChild(b);
      });
    }

    const fromEvent = (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      setPos((x / rect.width) * 100);
    };
    let dragging = false;
    frame.addEventListener("pointerdown", (e) => {
      dragging = true;
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
    frame.addEventListener("pointerup", () => { dragging = false; });
    frame.addEventListener("pointercancel", () => { dragging = false; });
    frame.tabIndex = 0;
    frame.setAttribute("role", "slider");
    frame.setAttribute("aria-label", "Before and after comparison — arrow keys move the divider");
    frame.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { setPos(pos - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { setPos(pos + 4); e.preventDefault(); }
    });

    if (sets.length) loadSet(0); else setPos(50);
  });
})();
