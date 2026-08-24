/* ============================================================
   Pre-2022 Search — a "Slop Evader" widget for the PSI site.
   Based on Slop Evader by Tega Brain (github.com/tegacodes/slop-evader):
   every search is capped at Nov 30, 2022 — the day ChatGPT launched —
   so results come from the web before generative AI.
   Self-contained: injects its own styles and markup, so any page
   only needs the one script tag.
   ============================================================ */
(function () {
  "use strict";

  var CUTOFF_LABEL = "Nov 30, 2022";
  // Google's strict date-range filter. Platforms without native date
  // filtering (Reddit, YouTube, …) are queried through Google with a
  // site: restriction — same approach as the original extension.
  var GOOGLE_CAP = "&tbs=cdr:1,cd_max:11/30/2022";

  var PLATFORMS = [
    { key: "google",        label: "Google",         site: null },
    { key: "duckduckgo",    label: "DuckDuckGo",     site: null },
    { key: "reddit",        label: "Reddit",         site: "reddit.com" },
    { key: "quora",         label: "Quora",          site: "quora.com" },
    { key: "stackexchange", label: "Stack Exchange", site: "stackexchange.com" },
    { key: "pinterest",     label: "Pinterest",      site: "pinterest.com" },
    { key: "youtube",       label: "YouTube",        site: "youtube.com" }
  ];

  function buildUrl(platform, query) {
    var q = encodeURIComponent(query);
    if (platform.key === "duckduckgo") {
      return "https://duckduckgo.com/?q=" + q + "&df=1990-01-01..2022-11-30";
    }
    if (platform.site) {
      return "https://www.google.com/search?q=site:" + platform.site + "+" + q + GOOGLE_CAP;
    }
    return "https://www.google.com/search?q=" + q + GOOGLE_CAP;
  }

  var CSS = "" +
    ".se-fab{position:fixed;right:18px;bottom:18px;z-index:60;display:inline-flex;align-items:center;gap:9px;" +
      "padding:11px 16px;border:0;border-radius:999px;cursor:pointer;background:var(--navy,#1d2733);color:#fff;" +
      "font:600 13.5px/1 'Avenir Next','Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:.02em;" +
      "box-shadow:0 8px 24px rgba(16,18,20,.28);transition:transform 160ms ease,background 160ms ease}" +
    ".se-fab:hover{background:var(--accent,#d60000);transform:translateY(-1px)}" +
    ".se-fab__dot{width:8px;height:8px;border-radius:50%;background:var(--accent,#d60000);flex:0 0 auto}" +
    ".se-fab:hover .se-fab__dot{background:#fff}" +
    "@media (max-width:859px){.se-fab{bottom:64px}}" + /* clear the sticky action bar */

    ".se-panel{position:fixed;right:18px;bottom:74px;z-index:61;width:min(380px,calc(100vw - 36px));" +
      "background:var(--paper,#f7f6f3);color:var(--ink,#101214);border-radius:14px;overflow:hidden;" +
      "box-shadow:0 18px 56px rgba(16,18,20,.35),0 0 0 1px rgba(16,18,20,.08);" +
      "font-family:'Avenir Next','Helvetica Neue',Helvetica,Arial,sans-serif;" +
      "opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity 200ms ease,transform 200ms ease}" +
    ".se-panel.is-open{opacity:1;transform:none;pointer-events:auto}" +
    "@media (max-width:859px){.se-panel{bottom:120px}}" +

    ".se-panel__head{background:var(--navy,#1d2733);color:#fff;padding:16px 18px 14px}" +
    ".se-panel__title{margin:0;font-size:15px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}" +
    ".se-panel__title em{font-style:normal;color:var(--accent,#d60000)}" +
    ".se-panel__sub{margin:6px 0 0;font-size:12.5px;line-height:1.5;opacity:.75}" +
    ".se-panel__close{position:absolute;top:10px;right:10px;width:28px;height:28px;border:0;border-radius:50%;" +
      "background:rgba(255,255,255,.12);color:#fff;font-size:15px;line-height:1;cursor:pointer}" +
    ".se-panel__close:hover{background:var(--accent,#d60000)}" +

    ".se-panel__body{padding:16px 18px 18px}" +
    ".se-row{display:flex;gap:8px}" +
    ".se-input{flex:1;min-width:0;padding:10px 12px;font:inherit;font-size:14px;color:var(--ink,#101214);" +
      "background:#fff;border:1px solid rgba(16,18,20,.18);border-radius:8px}" +
    ".se-input:focus{outline:none;border-color:var(--accent,#d60000)}" +
    ".se-go{padding:10px 16px;border:0;border-radius:8px;background:var(--accent,#d60000);color:#fff;" +
      "font:600 14px/1 inherit;cursor:pointer;white-space:nowrap}" +
    ".se-go:hover{background:#b30000}" +

    ".se-eyebrow{margin:14px 0 8px;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;" +
      "color:var(--muted,#6b7075)}" +
    ".se-chips{display:flex;flex-wrap:wrap;gap:6px}" +
    ".se-chip{padding:6px 11px;border:1px solid rgba(16,18,20,.18);border-radius:999px;background:#fff;" +
      "color:var(--ink,#101214);font:500 12.5px/1 inherit;cursor:pointer;transition:all 140ms ease}" +
    ".se-chip:hover{border-color:var(--accent,#d60000);color:var(--accent,#d60000)}" +
    ".se-chip.is-active{background:var(--navy,#1d2733);border-color:var(--navy,#1d2733);color:#fff}" +

    ".se-credit{margin:14px 0 0;font-size:11px;line-height:1.5;color:var(--muted,#6b7075)}" +
    ".se-credit a{color:inherit;text-decoration:underline}" +
    ".se-credit a:hover{color:var(--accent,#d60000)}";

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { el.appendChild(c); });
    return el;
  }

  function init() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var selected = PLATFORMS[0];

    var fab = h("button", {
      "class": "se-fab", type: "button",
      "aria-expanded": "false", "aria-controls": "sePanel",
      title: "Search the pre-AI web"
    }, [
      h("span", { "class": "se-fab__dot", "aria-hidden": "true" }),
      h("span", { text: "Pre-2022 Search" })
    ]);

    var input = h("input", {
      "class": "se-input", type: "text", id: "seQuery",
      placeholder: "Search the pre-AI web…"
    });
    var goBtn = h("button", { "class": "se-go", type: "button", text: "Search" });

    var chipWrap = h("div", { "class": "se-chips", role: "group", "aria-label": "Search platform" });
    PLATFORMS.forEach(function (p, i) {
      var chip = h("button", {
        "class": "se-chip" + (i === 0 ? " is-active" : ""),
        type: "button", text: p.label, "aria-pressed": i === 0 ? "true" : "false"
      });
      chip.addEventListener("click", function () {
        selected = p;
        chipWrap.querySelectorAll(".se-chip").forEach(function (c) {
          c.classList.remove("is-active");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("is-active");
        chip.setAttribute("aria-pressed", "true");
        input.placeholder = "Search " + p.label + " before " + CUTOFF_LABEL + "…";
        input.focus();
      });
      chipWrap.appendChild(chip);
    });

    var closeBtn = h("button", { "class": "se-panel__close", type: "button", "aria-label": "Close", text: "×" });

    var credit = h("p", { "class": "se-credit" });
    credit.innerHTML = 'Results are capped at ' + CUTOFF_LABEL + ' &mdash; the day ChatGPT launched. ' +
      'Based on <a href="https://tegabrain.com/Slop-Evader" target="_blank" rel="noopener">Slop Evader</a> by Tega Brain.';

    var panel = h("div", { "class": "se-panel", id: "sePanel", role: "dialog", "aria-label": "Pre-2022 search" }, [
      h("div", { "class": "se-panel__head" }, [
        h("p", { "class": "se-panel__title" }),
        h("p", { "class": "se-panel__sub", text: "Browse the web from before generative AI. Every search below only returns pages published before " + CUTOFF_LABEL + "." }),
        closeBtn
      ]),
      h("div", { "class": "se-panel__body" }, [
        h("div", { "class": "se-row" }, [input, goBtn]),
        h("p", { "class": "se-eyebrow", text: "Search on" }),
        chipWrap,
        credit
      ])
    ]);
    panel.querySelector(".se-panel__title").innerHTML = "Pre-2022 <em>Search</em>";

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) input.focus();
    }
    fab.addEventListener("click", function () {
      setOpen(!panel.classList.contains("is-open"));
    });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) setOpen(false);
    });

    function search() {
      var q = input.value.trim();
      if (!q) { input.focus(); return; }
      window.open(buildUrl(selected, q), "_blank", "noopener");
    }
    goBtn.addEventListener("click", search);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") search();
    });

    document.body.appendChild(panel);
    document.body.appendChild(fab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
