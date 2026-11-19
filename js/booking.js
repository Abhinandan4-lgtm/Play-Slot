/* ==========================================================================
   PlaySlot - booking.js
   Used by booking.html and my-bookings.html.
   All data access goes through api.js (createBooking, getBookings, ...).
   ========================================================================== */

const CUSTOMER_KEY = "playslot_customer";

function getSavedCustomer() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || {};
  } catch (e) {
    return {};
  }
}

/* ==========================================================================
   BOOKING PAGE
   ========================================================================== */

const bk = {
  venue: null,
  courts: [],
  slotBookings: [],
  selectedSlot: null
};

async function initBookingPage() {
  const venue = await getVenueById(getParam("venue"));

  if (!venue) {
    document.getElementById("venueMissing").classList.remove("d-none");
    return;
  }

  bk.venue = venue;
  bk.courts = (await getCourts(venue.id)).filter((c) => c.available);

  document.getElementById("bookingLayout").classList.remove("d-none");

  // Venue details
  document.getElementById("venueImage").innerHTML =
    imgTag(venue.image, venue.name, "booking-hero-img");

  const chip = document.getElementById("venueSport");
  chip.textContent = venue.sport;
  chip.className = `chip chip-${venue.sport}`;

  document.getElementById("venueName").textContent = venue.name;
  document.getElementById("venueLocation").textContent = venue.location;
  document.getElementById("venueRating").textContent =
    Number(venue.rating).toFixed(1);

  document.getElementById("venueDesc").textContent =
    venue.description || "";

  document.getElementById("venuePrice").innerHTML =
    `${formatCurrency(venue.pricePerHour)} <small>/ hour</small>`;

  document.getElementById("sumVenue").textContent = venue.name;
  document.getElementById("sumSport").textContent = venue.sport;

  document.getElementById("sumRate").textContent =
    formatCurrency(venue.pricePerHour) + " / hour";

  // Courts dropdown
  const courtSelect = document.getElementById("courtSelect");

  courtSelect.innerHTML = bk.courts
    .map((c) =>
      `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.surface)})</option>`
    )
    .join("");

  // Block booking if venue or all courts are unavailable
  if (!venue.available || bk.courts.length === 0) {
    document.getElementById("venueUnavailable").classList.remove("d-none");
    document.getElementById("confirmBtn").disabled = true;

    courtSelect.innerHTML = `<option>No courts available</option>`;
    courtSelect.disabled = true;

    document.getElementById("dateInput").disabled = true;
    return;
  }

  // Date picker
  const dateInput = document.getElementById("dateInput");

  dateInput.min = todayISO();

  const wanted = getParam("date");

  dateInput.value =
    wanted && wanted >= todayISO()
      ? wanted
      : todayISO();

  // Prefill returning customer details
  const saved = getSavedCustomer();

  document.getElementById("custName").value = saved.name || "";
  document.getElementById("custEmail").value = saved.email || "";
  document.getElementById("custPhone").value = saved.phone || "";

  // Event listeners
  courtSelect.addEventListener("change", () => {
    bk.selectedSlot = null;
    loadSlots();
  });

  dateInput.addEventListener("change", () => {
    bk.selectedSlot = null;
    loadSlots();
  });

  document
    .getElementById("confirmBtn")
    .addEventListener("click", handleConfirmBooking);

  loadSlots();
}


// Fetch bookings for selected court and date
async function loadSlots() {
  const courtId = document.getElementById("courtSelect").value;
  const date = document.getElementById("dateInput").value;

  if (!date || date < todayISO()) {
    document.getElementById("slotGrid").innerHTML =
      `<p class="text-muted mb-0">Choose a date from today onwards.</p>`;

    updateSummary();
    return;
  }

  bk.slotBookings = await getBookings({ courtId, date });

  renderSlots();
  updateSummary();
}


// Display available time slots
function renderSlots() {
  const date = document.getElementById("dateInput").value;
  const grid = document.getElementById("slotGrid");

  grid.innerHTML = SLOTS.map((slot) => {
    const booked = bk.slotBookings.some(
      (b) => b.slot === slot && ACTIVE_STATUSES.includes(b.status)
    );

    const past = isPastSlot(date, slot);
    const selected = bk.selectedSlot === slot;

    return `
      <button
        type="button"
        class="slot-btn ${selected ? "selected" : ""}"
        data-slot="${slot}"
        ${booked || past ? "disabled" : ""}
        title="${
          booked
            ? "Already booked"
            : past
            ? "This time has passed"
            : "Available"
        }"
      >
        ${formatSlot(slot)}
      </button>
    `;
  }).join("");

  grid.querySelectorAll(".slot-btn:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => {
      bk.selectedSlot = btn.dataset.slot;

      document.getElementById("slotError").classList.add("d-none");

      renderSlots();
      updateSummary();
    });
  });
}


// Update booking summary
function updateSummary() {
  const court = bk.courts.find(
    (c) => c.id === document.getElementById("courtSelect").value
  );

  const date = document.getElementById("dateInput").value;

  document.getElementById("sumCourt").textContent =
    court ? court.name : "-";

  document.getElementById("sumDate").textContent =
    date ? formatDate(date) : "-";

  document.getElementById("sumSlot").textContent =
    bk.selectedSlot ? formatSlot(bk.selectedSlot) : "Not selected";

  document.getElementById("sumTotal").textContent =
    formatCurrency(bk.selectedSlot ? bk.venue.pricePerHour : 0);
}


/* ==========================================================================
   CONFIRM BOOKING - AWS INTEGRATION
   ========================================================================== */

async function handleConfirmBooking() {
  const form = document.getElementById("bookingForm");
  const slotError = document.getElementById("slotError");

  form.classList.add("was-validated");

  const phoneInput = document.getElementById("custPhone");

  if (!bk.selectedSlot) {
    slotError.classList.remove("d-none");
  }

  if (!form.checkValidity() || !bk.selectedSlot) {
    showToast(
      !bk.selectedSlot
        ? "Please select an available time slot."
        : "Please fix the highlighted fields.",
      "warning"
    );

    if (!form.checkValidity()) {
      form.querySelector(":invalid").focus();
    }

    return;
  }

  const btn = document.getElementById("confirmBtn");

  btn.disabled = true;

  try {
    // Find selected court details
    const selectedCourtId =
      document.getElementById("courtSelect").value;

    const selectedCourt = bk.courts.find(
      (c) => c.id === selectedCourtId
    );

    if (!selectedCourt) {
      throw new Error("Please select a valid court.");
    }

    // Prepare complete booking data for AWS Lambda
    const bookingData = {
      venueId: bk.venue.id,
      venueName: bk.venue.name,
      sport: bk.venue.sport,

      courtId: selectedCourt.id,
      courtName: selectedCourt.name,

      date: document.getElementById("dateInput").value,
      slot: bk.selectedSlot,

      customerName: document.getElementById("custName").value.trim(),
      email: document.getElementById("custEmail").value.trim(),
      phone: phoneInput.value.trim(),

      amount: Number(bk.venue.pricePerHour)
    };

    // Send booking to API Gateway -> Lambda -> DynamoDB
    const booking = await createBooking(bookingData);

    // Remember customer details
    localStorage.setItem(
      CUSTOMER_KEY,
      JSON.stringify({
        name: booking.customerName,
        email: booking.email,
        phone: booking.phone,
        venueName: bk.venue.name,
        sport: bk.venue.sport,
        courtName: selectedCourt.name,
        amount: Number(bk.venue.pricePerHour),
      })
    );

    // Display booking confirmation
    document.getElementById("successId").textContent = booking.id;

    document.getElementById("successDetails").innerHTML = `
      <div class="summary-row">
        <span>Venue</span>
        <span>${esc(booking.venueName)}</span>
      </div>

      <div class="summary-row">
        <span>Court</span>
        <span>${esc(booking.courtName)}</span>
      </div>

      <div class="summary-row">
        <span>Date</span>
        <span>${formatDate(booking.date)}</span>
      </div>

      <div class="summary-row">
        <span>Time</span>
        <span>${formatSlot(booking.slot)}</span>
      </div>

      <div class="summary-row">
        <span>Amount</span>
        <span>${formatCurrency(booking.amount)}</span>
      </div>
    `;

    openModal("successModal");

    // Reset selection and refresh available slots
    bk.selectedSlot = null;

    form.classList.remove("was-validated");

    await loadSlots();

  } catch (err) {
    console.error("Booking error:", err);

    showToast(err.message, "danger");

    await loadSlots();

  } finally {
    btn.disabled = false;
  }
}


/* ==========================================================================
   MY BOOKINGS PAGE
   ========================================================================== */

const DEFAULT_DEMO_EMAIL = "aarav.sharma@example.com";

async function initMyBookingsPage() {
  const emailInput = document.getElementById("lookupEmail");

  emailInput.value =
    getSavedCustomer().email || DEFAULT_DEMO_EMAIL;

  document.getElementById("lookupHint").textContent =
    "Demo tip: try priya.nair@example.com";

  document.getElementById("lookupForm").addEventListener("submit", (e) => {
    e.preventDefault();

    e.target.classList.add("was-validated");

    if (!emailInput.checkValidity()) return;

    renderMyBookings();
  });

  renderMyBookings();
}


// Display customer's bookings
async function renderMyBookings() {
  const email =
    document.getElementById("lookupEmail").value.trim();

  const area = document.getElementById("bookingsArea");

  const bookings = await getBookings({ email });

  if (!bookings.length) {
    area.innerHTML = `
      <div class="panel empty-state">
        <i class="bi bi-calendar-x"></i>

        <h5 class="mt-3">
          No bookings for ${esc(email)}
        </h5>

        <p class="text-muted">
          When you book a court, it will show up here.
        </p>

        <a class="btn btn-green" href="venues.html">
          Find a venue
        </a>
      </div>
    `;

    return;
  }

  const today = todayISO();

  area.innerHTML = `
    <div class="table-wrap">
      <div class="table-responsive">

        <table class="table table-hover ps-table align-middle">

          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Venue</th>
              <th>Sport</th>
              <th>Date</th>
              <th>Time slot</th>
              <th>Amount</th>
              <th>Status</th>
              <th class="text-end">Action</th>
            </tr>
          </thead>

          <tbody>
            ${bookings.map((b) => {
              const canCancel =
                ACTIVE_STATUSES.includes(b.status) && b.date >= today;

              return `
                <tr>
                  <td class="fw-semibold">
                    ${esc(b.id)}
                  </td>

                  <td>
                    ${esc(b.venueName)}
                    <div class="small text-muted">
                      ${esc(b.courtName)}
                    </div>
                  </td>

                  <td>
                    <span class="chip chip-${esc(b.sport)}">
                      ${esc(b.sport)}
                    </span>
                  </td>

                  <td>${formatDate(b.date)}</td>

                  <td>${formatSlot(b.slot)}</td>

                  <td>${formatCurrency(b.amount)}</td>

                  <td>${statusBadge(b.status)}</td>

                  <td class="text-end">
                    <button
                      class="btn btn-sm btn-outline-danger"
                      data-cancel="${esc(b.id)}"
                      ${canCancel ? "" : "disabled"}
                    >
                      Cancel booking
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>

        </table>

      </div>
    </div>
  `;

  area.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () =>
      handleCancel(btn.dataset.cancel)
    );
  });
}


// Cancel booking
async function handleCancel(id) {
  const ok = await confirmAction({
    title: "Cancel this booking?",
    message: `Booking ${id} will be cancelled and the slot will open up for other players.`,
    confirmText: "Cancel booking"
  });

  if (!ok) return;

  try {
    await cancelBooking(id);

    showToast("Booking cancelled.", "success");

    renderMyBookings();

  } catch (err) {
    showToast(err.message, "danger");
  }
}


/* ==========================================================================
   START THE RIGHT PAGE
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "booking") {
    initBookingPage();
  }

  if (page === "my-bookings") {
    initMyBookingsPage();
  }
});