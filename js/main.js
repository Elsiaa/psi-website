/* ============================================================
   PSI Construction — site behaviour
   - Nav: transparent over hero, solid after; mobile menu
   - Scroll reveals (IntersectionObserver, reduced-motion aware)
   - Selected Work: before/after drag slider
   - Walkthrough: scroll-linked chapter media
   - Previous Projects: Leaflet map + list + carousel, synchronized
   - Google Reviews: hook-first cards with expandable full text
   - Gallery deep links (data-gallery-cat)
   ============================================================ */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------- Nav ----------------
  const nav = document.getElementById("topNav");
  const heroEl = document.getElementById("hero");
  const onScroll = () => {
    const threshold = heroEl ? heroEl.offsetHeight - window.innerHeight * 0.5 : 40;
    nav.classList.toggle("nav--solid", window.scrollY > threshold);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () =>
      setMenu(!document.body.classList.contains("menu-open")));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  // ---------------- Scroll reveals ----------------
  const revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in-view"));
  } else {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in-view");
          ro.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach((el) => ro.observe(el));
  }

  // ---------------- Gallery deep links ----------------
  // Any element with data-gallery-cat activates that filter on arrival.
  document.querySelectorAll("[data-gallery-cat]").forEach((a) => {
    a.addEventListener("click", () => {
      const cat = a.getAttribute("data-gallery-cat");
      const btn = document.querySelector(`.gallery__filter[data-cat="${cat}"]`);
      if (btn) btn.click();
    });
  });

  // ---------------- Before / After slider ----------------
  const SETS = [
    {
      label: "New Build",
      before: "assets/photos/PSI_BA-01_Site_BEFORE_VacantLot.jpg",
      after: "assets/photos/PSI_BA-01_Site_AFTER_FinishedTwilight.jpg",
      caption: "Set 01 — A vacant lot becomes a finished three-story residence."
    },
    {
      label: "Great Room",
      before: "assets/photos/PSI_BA-02_GreatRoom_BEFORE_GutDemo.jpg",
      after: "assets/photos/PSI_BA-02_GreatRoom_AFTER_Finished.jpg",
      caption: "Set 02 — Full gut demolition to a finished great room."
    },
    {
      label: "Interior",
      before: "assets/photos/PSI_BA-03_Interior_BEFORE_DatedCarpetAndBuiltIns.jpg",
      after: "assets/photos/PSI_BA-03_Interior_AFTER_LVP_OpenRoom.jpg",
      caption: "Set 03 — Dated carpet and built-ins to an open room with new LVP flooring."
    }
  ];

  const baFrame = document.getElementById("baFrame");
  if (baFrame) {
    const baBefore = document.getElementById("baBefore");
    const baAfter = document.getElementById("baAfter");
    const baTabs = document.getElementById("baTabs");
    const baCaption = document.getElementById("baCaption");

    let pos = 50;
    const setPos = (pct) => {
      pos = Math.min(96, Math.max(4, pct));
      baFrame.style.setProperty("--ba-pos", pos + "%");
    };

    const loadSet = (i) => {
      const s = SETS[i];
      baBefore.src = s.before;
      baAfter.src = s.after;
      baBefore.alt = "Before — " + s.caption;
      baAfter.alt = "After — " + s.caption;
      baCaption.textContent = s.caption;
      baTabs.querySelectorAll(".ba__tab").forEach((b, j) =>
        b.classList.toggle("is-active", j === i));
      setPos(50);
    };

    SETS.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ba__tab";
      b.textContent = String(i + 1).padStart(2, "0") + " " + s.label;
      b.addEventListener("click", () => loadSet(i));
      baTabs.appendChild(b);
    });

    const fromEvent = (e) => {
      const rect = baFrame.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      setPos((x / rect.width) * 100);
    };
    let dragging = false;
    baFrame.addEventListener("pointerdown", (e) => {
      dragging = true;
      baFrame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    baFrame.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
    baFrame.addEventListener("pointerup", () => { dragging = false; });
    baFrame.addEventListener("pointercancel", () => { dragging = false; });
    // Keyboard access
    baFrame.tabIndex = 0;
    baFrame.setAttribute("role", "slider");
    baFrame.setAttribute("aria-label", "Before and after comparison — arrow keys move the divider");
    baFrame.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { setPos(pos - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { setPos(pos + 4); e.preventDefault(); }
    });

    loadSet(0);
  }

  // ---------------- Walkthrough ----------------
  const walkSteps = document.querySelectorAll(".walk__step");
  const walkFrame = document.getElementById("walkFrame");
  if (walkSteps.length && walkFrame) {
    const imgs = [];
    walkSteps.forEach((step, i) => {
      const img = document.createElement("img");
      img.className = "walk__img";
      img.src = step.dataset.img;
      img.alt = "";
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      walkFrame.insertBefore(img, walkFrame.firstChild);
      imgs.push(img);
    });
    const count = document.getElementById("walkCount");
    const total = String(walkSteps.length).padStart(2, "0");

    const activate = (i) => {
      walkSteps.forEach((s, j) => s.classList.toggle("is-active", j === i));
      imgs.forEach((im, j) => im.classList.toggle("is-active", j === i));
      if (count) count.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b> / ${total}`;
    };

    if ("IntersectionObserver" in window) {
      const wo = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) activate([...walkSteps].indexOf(en.target));
        });
      }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
      walkSteps.forEach((s) => wo.observe(s));
    }
    activate(0);
  }

  // ---------------- Previous Projects ----------------
  const projects = window.PSI_PROJECTS || [];
  const office = window.PSI_OFFICE;
  const mapEl = document.getElementById("projectMap");
  if (mapEl && projects.length && typeof L !== "undefined") {

    const map = L.map(mapEl, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const pinIcon = (active) => L.divIcon({
      className: "",
      html: `<div class="pin${active ? " pin--active" : ""}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 16]
    });

    if (office) {
      L.marker([office.lat, office.lng], {
        icon: L.divIcon({ className: "", html: '<div class="pin pin--office"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
      }).addTo(map).bindPopup(`<strong>${office.name}</strong><br>${office.address}<br><em>Visits available upon request</em>`);
    }

    const markers = projects.map((p, i) => {
      const m = L.marker([p.lat, p.lng], { icon: pinIcon(false) }).addTo(map);
      m.bindPopup(`<strong>${p.name}</strong><br>${p.city}`);
      m.on("click", () => select(i, "map"));
      return m;
    });
    const allBounds = L.latLngBounds(projects.map(p => [p.lat, p.lng])).pad(0.08);
    map.fitBounds(allBounds);

    let fitted = mapEl.clientWidth > 0 && mapEl.clientHeight > 0;
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        map.invalidateSize();
        if (!fitted && mapEl.clientWidth > 0 && mapEl.clientHeight > 0) {
          fitted = true;
          map.fitBounds(allBounds);
        }
      });
      ro.observe(mapEl);
    }

    // List
    const listEl = document.getElementById("projectList");
    const rows = projects.map((p, i) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "project-list__row";
      row.setAttribute("role", "option");
      row.innerHTML = `
        <span class="project-list__idx">${String(i + 1).padStart(2, "0")}</span>
        <span class="project-list__name">${p.name}</span>
        <span class="project-list__city">${p.city}</span>
        ${p.type ? `<span class="project-list__type">${p.type}</span>` : ""}`;
      row.addEventListener("click", () => select(i, "list"));
      listEl.appendChild(row);
      return row;
    });

    // Carousel
    const track = document.getElementById("carouselTrack");
    const counter = document.getElementById("carouselCounter");
    projects.forEach((p) => {
      const slide = document.createElement("div");
      slide.className = "carousel__slide";
      slide.innerHTML = `
        <div class="carousel__img"><img loading="lazy" src="${p.img}" alt="${p.caption || p.name}"></div>
        <div class="carousel__info">
          <p class="eyebrow eyebrow--red">Previous Project</p>
          <h3>${p.name}</h3>
          <p class="carousel__loc">${p.city}</p>
          ${p.type ? `<p class="carousel__type">${p.type}</p>` : ""}
          ${p.desc ? `<p class="carousel__desc">${p.desc}</p>` : ""}
          <p class="carousel__caption">${p.caption || ""}${p.desc ? "" : " &mdash; PSI portfolio photography"}</p>
          ${p.plans ? `<a class="carousel__plans" href="${p.plans}" target="_blank" rel="noopener">View filed plans (PDF)</a>` : ""}
        </div>`;
      track.appendChild(slide);
    });

    let current = -1;

    function select(i, source) {
      if (i === current) {
        if (source === "list" || source === "carousel") focusPin(i);
        return;
      }
      if (current >= 0) {
        markers[current].setIcon(pinIcon(false));
        rows[current].classList.remove("is-active");
      }
      current = i;
      const p = projects[i];

      markers[i].setIcon(pinIcon(true));
      if (source !== "map" && source !== "init") focusPin(i);
      if (source !== "init") markers[i].openPopup();

      rows[i].classList.add("is-active");
      rows[i].scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });

      track.style.transform = `translateX(-${i * 100}%)`;
      counter.textContent = `${i + 1} / ${projects.length} — ${p.name}`;
    }

    function focusPin(i) {
      const p = projects[i];
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: reducedMotion ? 0 : 0.7 });
    }

    document.getElementById("carouselPrev").addEventListener("click", () =>
      select((current - 1 + projects.length) % projects.length, "carousel"));
    document.getElementById("carouselNext").addEventListener("click", () =>
      select((current + 1) % projects.length, "carousel"));

    select(0, "init");
  }

  // ---------------- Google Reviews ----------------
  const reviews = [
    { author: "Yossi Lasker", stars: 5,
      hook: "If you’re looking for quality work at an honest price, PSI Construction is the way to go.",
      rest: "We couldn’t be happier with our experience working with PSI Construction. They handled a full home remodel and finished our basement, and the results are absolutely fantastic. The team was professional, efficient, and respectful of our home. The project moved along quickly, and the pricing was by far the best we found." },
    { author: "Ben Berkovitz", stars: 5,
      hook: "Very patient, transparent, communicative and very professional throughout our entire project.",
      rest: "PSI Construction did an amazing job on our renovation plus new build project. Their pricing was very competitive, and they completed the project within the expected timeline they gave us. Whenever something came up, they provided us with all the different options we could choose from. I highly recommend them and would hire them again for future projects." },
    { author: "Moshe Dahan", stars: 5,
      hook: "The job was done and the bathroom was usable in three days.",
      rest: "Had these guys do my guest/office bathroom over in my house. The bosses are super professional and detailed with what goes into each job. Great communication and great work. They quoted me on window replacement and another bathroom remodel and I’m going with them for both jobs. Worth every penny working with these guys." },
    { author: "Mendel Erlenwein", stars: 5,
      hook: "They came through on every single detail without constantly trying to up the estimate.",
      rest: "Unbelievable work, could not recommend enough! As always, things come up in projects, new design ideas, etc. Everything was meticulously planned out and executed to perfection. Great folks to work with and most of all, honest and stand behind their work!" },
    { author: "Mushkie Schaeffer", stars: 5,
      hook: "The finished sauna is both functional and spa-like.",
      rest: "We had a seamless experience working with PSI on our custom home sauna. Although this was their first sauna project, they proved confidence and execution in their build — due to their research in providing us with the best materials for performance and visuals. We highly recommend them to anyone looking for an in-home sauna room that looks crafted and state-of-the-art!" },
    { author: "Mikaela", stars: 4,
      hook: "We were extremely impressed with the tile work for the tub area.",
      rest: "Great price. PSI came referred to us through friends in the NEPA area. They renovated our guest bath for us in a matter of a few weeks. They were communicative and worked with us to achieve an on-time completion date." },
    { author: "Miguel Andres Contreras", stars: 5,
      hook: "Couldn’t be happier with the work, honesty and professionalism.",
      rest: "" }
  ];

  const grid = document.getElementById("reviewsGrid");
  if (grid) {
    reviews.forEach((r) => {
      const card = document.createElement("article");
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-card__stars" aria-label="${r.stars} out of 5 stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
        <p class="review-card__hook">“${r.hook}”</p>
        ${r.rest ? `<p class="review-card__text is-collapsed">${r.rest}</p>
        <button class="review-card__expand" type="button">Read full review</button>` : ""}
        <p class="review-card__author">${r.author}<small>${r.stars} Stars · Google Review</small></p>`;
      const btn = card.querySelector(".review-card__expand");
      if (btn) {
        btn.addEventListener("click", () => {
          const txt = card.querySelector(".review-card__text");
          const collapsed = txt.classList.toggle("is-collapsed");
          btn.textContent = collapsed ? "Read full review" : "Show less";
        });
      }
      grid.appendChild(card);
    });
  }
})();
