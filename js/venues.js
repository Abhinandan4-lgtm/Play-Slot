/* ==========================================================================
   PlaySlot - venues.js
   Used by index.html (home) and venues.html (venue listing).
   ========================================================================== */

/* ---------- Shared: venue card ---------- */
// freeSlots: number or null. buttonLabel: "View Details" (home) or "Book Now" (listing)
function venueCardHTML(venue, { buttonLabel = "Book Now", freeSlots = null } = {}) {
  let availability;
  if (!venue.available) {
    availability = `<span class="avail none"><span class="dot"></span>Currently unavailable</span>`;
  } else if (freeSlots === null) {
    availability = `<span class="avail"><span class="dot"></span>Courts available</span>`;
  } else if (freeSlots === 0) {
    availability = `<span class="avail none"><span class="dot"></span>Fully booked</span>`;
  } else {
    availability = `<span class="avail ${freeSlots <= 4 ? "low" : ""}"><span class="dot"></span>${freeSlots} slots free</span>`;
  }
  const disabled = !venue.available ? "disabled" : "";
  const href = venue.available ? `booking.html?venue=${encodeURIComponent(venue.id)}` : "#";
  return `
  <div class="col-md-6 col-xl-4">
    <article class="venue-card">
      <div class="thumb">
        ${imgTag(venue.image, venue.name)}
        <span class="chip chip-${esc(venue.sport)} sport-chip">${esc(venue.sport)}</span>
        <span class="rating-chip"><i class="bi bi-star-fill"></i> ${Number(venue.rating).toFixed(1)}</span>
      </div>
      <div class="card-body">
        <h5>${esc(venue.name)}</h5>
        <div class="venue-meta mb-2"><i class="bi bi-geo-alt me-1"></i>${esc(venue.location)}</div>
        <p class="venue-meta flex-grow-1">${esc(venue.description || "").slice(0, 95)}${(venue.description || "").length > 95 ? "…" : ""}</p>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="price-tag">${formatCurrency(venue.pricePerHour)} <small>/ hour</small></span>
          ${availability}
        </div>
        <a class="btn ${venue.available ? "btn-green" : "btn-secondary"} w-100 ${disabled}" href="${href}">${buttonLabel}</a>
      </div>
    </article>
  </div>`;
}

/* ==========================================================================
   HOME PAGE
   ========================================================================== */
async function initHomePage() {
  const venues = await getVenues();

  // Fill location dropdown from real data
  const locations = [...new Set(venues.map((v) => v.location))].sort();
  const locSelect = document.getElementById("searchLocation");
  locations.forEach((l) => locSelect.insertAdjacentHTML("beforeend", `<option>${esc(l)}</option>`));

  // Date picker: today or later
  const dateInput = document.getElementById("searchDate");
  dateInput.min = todayISO();
  dateInput.value = todayISO();

  // Search -> go to venues.html with the chosen filters in the URL
  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const sport = document.getElementById("searchSport").value;
    if (sport) params.set("sport", sport);
    if (locSelect.value) params.set("location", locSelect.value);
    if (dateInput.value) params.set("date", dateInput.value);
    window.location.href = "venues.html?" + params.toString();
  });

  // Popular venues = best rated, bookable venues
  const popular = venues.filter((v) => v.available).sort((a, b) => b.rating - a.rating).slice(0, 6);
  document.getElementById("popularVenues").innerHTML = popular.map((v) => venueCardHTML(v, { buttonLabel: "View Details" })).join("");

  // Show real counts on the featured sport cards
  ["Badminton", "Football", "Cricket"].forEach((sport) => {
    const el = document.getElementById("count-" + sport);
    if (el) el.textContent = `${venues.filter((v) => v.sport === sport).length} venues`;
  });
}

/* ==========================================================================
   VENUE LISTING PAGE
   ========================================================================== */
const listingState = { venues: [], bookings: [], courts: [], sport: "All" };

async function initListingPage() {
  [listingState.venues, listingState.bookings, listingState.courts] = await Promise.all([getVenues(), getBookings(), getCourts()]);

  // Location dropdown
  const locSelect = document.getElementById("filterLocation");
  [...new Set(listingState.venues.map((v) => v.location))].sort()
    .forEach((l) => locSelect.insertAdjacentHTML("beforeend", `<option>${esc(l)}</option>`));

  // Date used for the availability indicator
  const dateInput = document.getElementById("filterDate");
  dateInput.min = todayISO();
  dateInput.value = getParam("date") && getParam("date") >= todayISO() ? getParam("date") : todayISO();

  // Read filters from the URL (coming from the home page search)
  if (getParam("sport")) setSportFilter(getParam("sport"));
  if (getParam("location")) locSelect.value = getParam("location");

  // Wire up events
  document.getElementById("filterSearch").addEventListener("input", renderListing);
  locSelect.addEventListener("change", renderListing);
  dateInput.addEventListener("change", renderListing);
  document.getElementById("filterPrice").addEventListener("change", renderListing);
  document.querySelectorAll("#sportPills button").forEach((btn) =>
    btn.addEventListener("click", () => { setSportFilter(btn.dataset.sport); renderListing(); }));
  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("filterSearch").value = "";
    locSelect.value = "";
    document.getElementById("filterPrice").value = "";
    setSportFilter("All");
    renderListing();
  });

  renderListing();
}

function setSportFilter(sport) {
  listingState.sport = sport;
  document.querySelectorAll("#sportPills button").forEach((b) => b.classList.toggle("active", b.dataset.sport === sport));
}

// How many hourly slots are still free on the chosen date (all available courts)
function countFreeSlots(venue, dateISO) {
  const courts = listingState.courts.filter((c) => c.venueId === venue.id && c.available);
  let free = 0;
  courts.forEach((court) => {
    SLOTS.forEach((slot) => {
      const taken = listingState.bookings.some((b) => b.courtId === court.id && b.date === dateISO && b.slot === slot && ACTIVE_STATUSES.includes(b.status));
      if (!taken && !isPastSlot(dateISO, slot)) free++;
    });
  });
  return free;
}

function renderListing() {
  const q = document.getElementById("filterSearch").value.trim().toLowerCase();
  const location = document.getElementById("filterLocation").value;
  const price = document.getElementById("filterPrice").value;   // "min-max"
  const date = document.getElementById("filterDate").value || todayISO();

  const results = listingState.venues.filter((v) => {
    if (listingState.sport !== "All" && v.sport !== listingState.sport) return false;
    if (location && v.location !== location) return false;
    if (q && !`${v.name} ${v.location} ${v.sport}`.toLowerCase().includes(q)) return false;
    if (price) {
      const [min, max] = price.split("-").map(Number);
      if (v.pricePerHour < min || v.pricePerHour > max) return false;
    }
    return true;
  });

  document.getElementById("resultCount").textContent = `${results.length} venue${results.length === 1 ? "" : "s"} found`;
  const grid = document.getElementById("venueGrid");
  if (!results.length) {
    grid.innerHTML = `<div class="col-12"><div class="empty-state panel"><i class="bi bi-search"></i>
      <h5 class="mt-3">No venues match your filters</h5><p class="text-muted">Try another sport, location or price range.</p></div></div>`;
    return;
  }
  grid.innerHTML = results.map((v) => {
    const free = v.available ? countFreeSlots(v, date) : 0;
    return venueCardHTML(v, { buttonLabel: "Book Now", freeSlots: free }).replace(
      `booking.html?venue=${encodeURIComponent(v.id)}`, `booking.html?venue=${encodeURIComponent(v.id)}&date=${date}`);
  }).join("");
}

/* ---------- Start the right page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "home") initHomePage();
  if (page === "venues") initListingPage();
});
