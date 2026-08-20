/* ============================================================
   PSI Photo Gallery: filterable grid + lightbox
   Data: window.PSI_GALLERY (data/gallery.js), generated from the
   PSI photo library. Thumbs in assets/photos/thumbs/, full-size
   in assets/photos/.
   ============================================================ */
(function () {
  "use strict";

  var PHOTOS = window.PSI_GALLERY || [];
  var grid = document.getElementById("galleryGrid");
  var filters = document.getElementById("galleryFilters");
  var moreBtn = document.getElementById("galleryMore");
  if (!grid || !PHOTOS.length) return;

  var PAGE = 24;               // thumbnails revealed per "Show More"
  var activeCat = "all";
  var visibleCount = PAGE;
  var current = [];            // photos matching the active filter

  /* "PSI_Bathroom_GreenTile_WalkInShower_01.jpg" → "Bathroom: Green Tile, Walk In Shower" */
  function caption(file) {
    var name = file.replace(/\.jpg$/i, "").replace(/^PSI_/, "").replace(/_0?\d+$/, "");
    var parts = name.split("_").map(function (p) {
      if (/^BA-\d+$/i.test(p)) return null;                       // set number → dropped
      if (p === p.toUpperCase() && p.length <= 7) {               // BEFORE / AFTER / DURING1 / LVP
        p = p.charAt(0) + p.slice(1).toLowerCase().replace(/(\d)$/, " $1");
      }
      return p.replace(/([a-z])([A-Z0-9])/g, "$1 $2");
    }).filter(Boolean);
    return parts.length > 1 ? parts[0] + ": " + parts.slice(1).join(", ") : parts[0];
  }

  function applyFilter(cat) {
    activeCat = cat;
    visibleCount = PAGE;
    current = cat === "all" ? PHOTOS.slice() : PHOTOS.filter(function (p) { return p.cat === cat; });
    render();
  }

  function render() {
    grid.innerHTML = "";
    var shown = current.slice(0, visibleCount);
    shown.forEach(function (p, i) {
      var btn = document.createElement("button");
      btn.className = "gallery__item";
      btn.setAttribute("aria-label", "Open photo: " + caption(p.file));
      var img = document.createElement("img");
      img.src = "assets/photos/thumbs/" + p.file;
      img.alt = caption(p.file);
      img.loading = "lazy";
      img.decoding = "async";
      btn.appendChild(img);
      var tag = document.createElement("span");
      tag.className = "gallery__tag";
      tag.textContent = caption(p.file);
      btn.appendChild(tag);
      btn.addEventListener("click", function () { openLightbox(i); });
      grid.appendChild(btn);
    });
    if (moreBtn) {
      moreBtn.hidden = visibleCount >= current.length;
      var remaining = current.length - visibleCount;
      if (remaining > 0) {
        moreBtn.textContent = "Show More Photos (" + remaining + " more)";
      }
    }
  }

  if (filters) {
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".gallery__filter");
      if (!btn) return;
      filters.querySelectorAll(".gallery__filter").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      applyFilter(btn.dataset.cat);
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      visibleCount += PAGE;
      render();
    });
  }

  /* ---------------- Lightbox ---------------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbCaption = document.getElementById("lightboxCaption");
  var lbCounter = document.getElementById("lightboxCounter");
  var lbIndex = 0;

  function openLightbox(i) {
    lbIndex = i;
    updateLightbox();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("lightboxClose").focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  function step(delta) {
    lbIndex = (lbIndex + delta + current.length) % current.length;
    updateLightbox();
  }

  function updateLightbox() {
    var p = current[lbIndex];
    lbImg.src = "assets/photos/" + p.file;
    lbImg.alt = caption(p.file);
    lbCaption.textContent = caption(p.file);
    lbCounter.textContent = (lbIndex + 1) + " / " + current.length;
    /* preload neighbours for instant arrows */
    [1, -1].forEach(function (d) {
      var n = current[(lbIndex + d + current.length) % current.length];
      if (n) { (new Image()).src = "assets/photos/" + n.file; }
    });
  }

  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxPrev").addEventListener("click", function () { step(-1); });
  document.getElementById("lightboxNext").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  applyFilter("all");
})();
