/* ============================================================
   PSI Appointment Booking
   Free in person or virtual appointments, booked from the
   homepage consultation section. Two calendars (US Eastern and
   EU Central European), each with deliberately limited slots.
   No backend: the request compiles into a pre-filled email to
   info@psiconstructionpa.com, same as the quote questionnaire.
   ============================================================ */
(() => {
  "use strict";

  const openBtn = document.getElementById("bookingOpen");
  const modal = document.getElementById("booking");
  const backdrop = document.getElementById("bookingBackdrop");
  const closeBtn = document.getElementById("bookingClose");
  const root = document.getElementById("bookingApp");
  if (!openBtn || !modal || !root) return;

  const REGIONS = {
    us: {
      label: "United States",
      tzShort: "ET",
      tzLong: "Eastern Time (ET)",
      slots: ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"]
    },
    eu: {
      label: "Europe",
      tzShort: "CET",
      tzLong: "Central European Time (CET)",
      slots: ["9:00", "11:00", "14:00", "16:00"]
    }
  };

  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const LEAD_DAYS = 2;      // earliest bookable day
  const HORIZON_DAYS = 45;  // latest bookable day

  const state = {
    step: "region",         // region | calendar | details | done
    region: null,
    month: null,            // Date, first of displayed month
    date: null,             // Date, chosen day
    slot: null
  };

  /* Deterministic "limited availability": the same day always
     shows the same openings, and the two regions differ. */
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function midnight(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  function dayOpen(region, d) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return false; // weekdays only
    const today = midnight(new Date());
    const diff = Math.round((midnight(d) - today) / 86400000);
    if (diff < LEAD_DAYS || diff > HORIZON_DAYS) return false;
    return hash(region + iso(d)) % 10 < 6; // roughly 6 of 10 weekdays open
  }

  function daySlots(region, d) {
    const all = REGIONS[region].slots;
    const open = all.filter((s, i) => hash(region + iso(d) + ":" + i) % 10 < 5);
    return open.length ? open : [all[hash(region + iso(d)) % all.length]];
  }

  /* ---------------- Modal open / close ---------------- */
  function openModal() {
    state.step = "region";
    state.region = null;
    state.date = null;
    state.slot = null;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    render();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* ---------------- Rendering ---------------- */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function backButton(handler) {
    const b = el("button", "quote__back", "← Back");
    b.type = "button";
    b.addEventListener("click", handler);
    return b;
  }

  function render() {
    root.innerHTML = "";
    if (state.step === "region") return renderRegion();
    if (state.step === "calendar") return renderCalendar();
    if (state.step === "details") return renderDetails();
  }

  /* Step 1: pick a continent (each has its own calendar) */
  function renderRegion() {
    root.appendChild(el("p", "booking__step", "Step 1 of 3: Where are you?"));
    const grid = el("div", "booking__regions");
    Object.keys(REGIONS).forEach(key => {
      const r = REGIONS[key];
      const card = el("button", "booking__region");
      card.type = "button";
      card.appendChild(el("span", "booking__region-name", r.label));
      card.appendChild(el("span", "booking__region-tz", r.tzLong));
      card.addEventListener("click", () => {
        state.region = key;
        const start = new Date();
        start.setDate(start.getDate() + LEAD_DAYS);
        state.month = new Date(start.getFullYear(), start.getMonth(), 1);
        state.step = "calendar";
        render();
      });
      grid.appendChild(card);
    });
    root.appendChild(grid);
  }

  /* Step 2: the region's calendar, limited openings only */
  function renderCalendar() {
    const region = state.region;
    const r = REGIONS[region];
    root.appendChild(el("p", "booking__step",
      "Step 2 of 3: Pick a day. Times shown in " + r.tzLong + "."));

    const head = el("div", "booking__cal-head");
    const prev = el("button", "booking__cal-nav", "←");
    const next = el("button", "booking__cal-nav", "→");
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "Previous month");
    next.setAttribute("aria-label", "Next month");
    const title = el("span", "booking__cal-title",
      MONTHS[state.month.getMonth()] + " " + state.month.getFullYear());

    const today = new Date();
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + HORIZON_DAYS);
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    prev.disabled = state.month <= minMonth;
    next.disabled = state.month >= maxMonth;
    prev.addEventListener("click", () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
      render();
    });
    next.addEventListener("click", () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
      render();
    });
    head.append(prev, title, next);
    root.appendChild(head);

    const grid = el("div", "booking__cal");
    DOW.forEach(d => grid.appendChild(el("span", "booking__cal-dow", d)));
    const firstDow = state.month.getDay();
    for (let i = 0; i < firstDow; i++) grid.appendChild(el("span", "booking__cal-pad"));
    const daysInMonth = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(state.month.getFullYear(), state.month.getMonth(), day);
      const cell = el("button", "booking__cal-day", String(day));
      cell.type = "button";
      if (dayOpen(region, d)) {
        cell.classList.add("is-open");
        cell.addEventListener("click", () => {
          state.date = d;
          state.slot = null;
          render();
          const slotsEl = root.querySelector(".booking__slots");
          if (slotsEl) slotsEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
        if (state.date && iso(state.date) === iso(d)) cell.classList.add("is-selected");
      } else {
        cell.disabled = true;
      }
      grid.appendChild(cell);
    }
    root.appendChild(grid);
    root.appendChild(el("p", "booking__note", "Only days with open slots are selectable."));

    if (state.date) {
      const wrap = el("div", "booking__slots");
      wrap.appendChild(el("p", "booking__slots-label",
        state.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
        " (" + r.tzShort + ")"));
      const row = el("div", "booking__slots-row");
      daySlots(region, state.date).forEach(s => {
        const chip = el("button", "booking__slot", s);
        chip.type = "button";
        if (state.slot === s) chip.classList.add("is-selected");
        chip.addEventListener("click", () => {
          state.slot = s;
          state.step = "details";
          render();
        });
        row.appendChild(chip);
      });
      wrap.appendChild(row);
      root.appendChild(wrap);
    }

    const controls = el("div", "quote__controls");
    controls.appendChild(backButton(() => {
      state.step = "region";
      state.date = null;
      state.slot = null;
      render();
    }));
    root.appendChild(controls);
  }

  /* Step 3: appointment type + contact details */
  function renderDetails() {
    const r = REGIONS[state.region];
    const when = state.date.toLocaleDateString("en-US",
      { weekday: "long", month: "long", day: "numeric" }) + " at " + state.slot + " " + r.tzShort;
    root.appendChild(el("p", "booking__step", "Step 3 of 3: Your details"));
    root.appendChild(el("p", "booking__picked", when));

    const form = el("form", "quote__form");
    const fields = [
      { key: "type", label: "Appointment type", type: "select", opts: ["Virtual (video call)", "In person"], required: true },
      { key: "name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone (optional)", type: "tel", required: false },
      { key: "company", label: "Company name (optional)", type: "text", required: false }
    ];
    fields.forEach(f => {
      const field = el("div", "quote__field");
      const label = el("label", null, f.label + (f.required ? " *" : ""));
      label.setAttribute("for", "bf_" + f.key);
      field.appendChild(label);
      let input;
      if (f.type === "select") {
        input = document.createElement("select");
        f.opts.forEach(o => {
          const op = document.createElement("option");
          op.value = op.textContent = o;
          input.appendChild(op);
        });
      } else {
        input = document.createElement("input");
        input.type = f.type;
      }
      input.id = "bf_" + f.key;
      if (f.required) input.required = true;
      field.appendChild(input);
      form.appendChild(field);
    });

    const controls = el("div", "quote__controls");
    controls.appendChild(backButton(() => { state.step = "calendar"; render(); }));
    const submit = el("button", "btn", "Request Appointment");
    submit.type = "submit";
    controls.appendChild(submit);
    form.appendChild(controls);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (k) => (document.getElementById("bf_" + k) || { value: "" }).value.trim();
      const lines = [
        "PSI CONSTRUCTION: APPOINTMENT REQUEST",
        "",
        "Region: " + r.label + " calendar (" + r.tzLong + ")",
        "Requested slot: " + when,
        "Appointment type: " + val("type"),
        "",
        "Name: " + val("name"),
        "Email: " + val("email")
      ];
      if (val("phone")) lines.push("Phone: " + val("phone"));
      if (val("company")) lines.push("Company: " + val("company"));
      const body = lines.join("\n");
      const subject = "Appointment Request: " + when + " (" + val("name") + ")";
      window.location.href = "mailto:info@psiconstructionpa.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      renderDone(when, subject, body);
    });

    root.appendChild(form);
  }

  function renderDone(when, subject, body) {
    root.innerHTML = "";
    const done = el("div", "quote__done");
    done.appendChild(el("h3", null, "Almost there"));
    const p = el("p", "body-copy");
    p.style.margin = "0 auto 14px";
    p.textContent = "Your email app just opened with the request for " + when +
      ". Hit send and we'll confirm your slot by email.";
    done.appendChild(p);
    const resend = el("a", "btn", "Open Email Again");
    resend.href = "mailto:info@psiconstructionpa.com?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    done.appendChild(resend);
    root.appendChild(done);
  }

  render();
})();
