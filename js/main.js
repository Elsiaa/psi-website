/* ============================================================
   PSI Construction — homepage behaviour
   - Nav: transparent over hero, solid after
   - Previous Projects: Leaflet map + list + carousel, synchronized
   - Google Reviews carousel
   ============================================================ */
(() => {
  "use strict";

  // ---------------- Nav ----------------
  const nav = document.getElementById("topNav");
  const onScroll = () => {
    const heroEl = document.getElementById("hero");
    const threshold = heroEl ? heroEl.offsetHeight - window.innerHeight * 0.5 : 40;
    nav.classList.toggle("nav--solid", window.scrollY > threshold);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------------- Previous Projects ----------------
  const projects = window.PSI_PROJECTS || [];
  const office = window.PSI_OFFICE;
  const mapEl = document.getElementById("projectMap");
  if (!mapEl || !projects.length || typeof L === "undefined") return;

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

  // Office marker (distinct, not part of the sync set)
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

  // If the map booted inside a hidden/zero-size container (collapsed panel,
  // background tab), Leaflet's sizing is wrong — refit once real layout lands.
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
        <p class="eyebrow eyebrow--accent">Previous Project</p>
        <h3>${p.name}</h3>
        <p class="carousel__loc">${p.city}</p>
        ${p.type ? `<p class="carousel__type">${p.type}</p>` : ""}
        ${p.desc ? `<p class="carousel__desc">${p.desc}</p>` : ""}
        <p class="carousel__caption">${p.caption || ""}${p.desc ? "" : " &mdash; PSI portfolio photography"}</p>
        ${p.plans ? `<a class="carousel__plans" href="${p.plans}" target="_blank" rel="noopener">View filed plans (PDF) &rarr;</a>` : ""}
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

    // Pin
    markers[i].setIcon(pinIcon(true));
    if (source !== "map" && source !== "init") focusPin(i);
    if (source !== "init") markers[i].openPopup();

    // List row
    rows[i].classList.add("is-active");
    rows[i].scrollIntoView({ block: "nearest", behavior: "smooth" });

    // Carousel
    track.style.transform = `translateX(-${i * 100}%)`;
    counter.textContent = `${i + 1} / ${projects.length} — ${p.name}`;
  }

  function focusPin(i) {
    const p = projects[i];
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
  }

  document.getElementById("carouselPrev").addEventListener("click", () =>
    select((current - 1 + projects.length) % projects.length, "carousel"));
  document.getElementById("carouselNext").addEventListener("click", () =>
    select((current + 1) % projects.length, "carousel"));

  select(0, "init");

  // ---------------- Google Reviews carousel ----------------
  const reviews = [
    { author: "Yossi Lasker", stars: 5, html: `We couldn&rsquo;t be happier with our experience working with PSI Construction. They handled a full home remodel and finished our basement, and the results are absolutely fantastic. The team was professional, efficient, and respectful of our home. The project moved along quickly, and the pricing was by far the best we found. <strong>If you&rsquo;re looking for quality work at an honest price, PSI Construction is the way to go.</strong>` },
    { author: "Mendel Erlenwein", stars: 5, html: `Unbelievable work, could not recommend enough! As always, things come up in projects, new design ideas, etc and they came through on every single detail without constantly trying to up the estimate. <strong>Everything was meticulously planned out and executed to perfection,</strong> Great folks to work with and most of all, honest and stand behind their work!` },
    { author: "Moshe Dahan", stars: 5, html: `Had these guys do my guest/office bathroom over in my house. <strong>The job was done and bathroom was usable in three days.</strong> The bosses are super professional and detailed with what goes into each job. Great communication and great work. They quoted me on window replacement and another bathroom remodel and I&rsquo;m going with them for both jobs. Worth every penny working with these guys.` },
    { author: "Ben Berkovitz", stars: 5, html: `PSI Construction did an amazing job on our renovation plus new build project. <strong>They were very patient, transparent, communicative and very professional throughout our entire project.</strong> Their pricing was very competitive, and they completed the project within the expected timeline they gave us. Whenever something came up, they provided us with all the different options we could choose from. I highly recommend them and would hire them again for future projects.` },
    { author: "Mikaela", stars: 4, html: `Great price. PSI came referred to us through friends in the NEPA area. They renovated our guest bath for us in a matter of a few weeks. They were communicative and worked with us to achieve an on-time completion date and <strong>we were extremely impressed with the tile work for the tub area!</strong>` },
    { author: "Mushkie Schaeffer", stars: 5, html: `We had a seamless experience working with PSI on our custom home sauna. Although this was their first sauna project, they proved confidence and execution in their build. <strong>The finished sauna is both functional and spa-like,</strong> due to their research in providing us with the best materials for performance and visuals. We highly recommend them to anyone looking for an in-home sauna room that looks crafted and state-of-the-art!` },
    { author: "Miguel Andres Contreras", stars: 5, html: `<strong>Couldn&rsquo;t be happier with the work, honesty and professionalism.</strong>` }
  ];

  const rTrack = document.getElementById("reviewsTrack");
  reviews.forEach((r) => {
    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = `
      <div class="review-card__stars" aria-label="${r.stars} out of 5 stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p class="review-card__text">&ldquo;${r.html}&rdquo;</p>
      <p class="review-card__author">${r.author}<small>${r.stars} Stars &middot; Google Review</small></p>`;
    rTrack.appendChild(card);
  });

  let rIndex = 0;
  function reviewStep() {
    const card = rTrack.querySelector(".review-card");
    if (!card) return 0;
    return card.getBoundingClientRect().width + 20;
  }
  function maxIndex() {
    const wrap = rTrack.parentElement.getBoundingClientRect().width;
    const visible = Math.max(1, Math.floor(wrap / reviewStep()));
    return Math.max(0, reviews.length - visible);
  }
  function renderReviews() {
    rIndex = Math.min(Math.max(0, rIndex), maxIndex());
    rTrack.style.transform = `translateX(-${rIndex * reviewStep()}px)`;
  }
  document.getElementById("reviewsPrev").addEventListener("click", () => { rIndex--; renderReviews(); });
  document.getElementById("reviewsNext").addEventListener("click", () => { rIndex++; renderReviews(); });
  window.addEventListener("resize", renderReviews, { passive: true });
})();
