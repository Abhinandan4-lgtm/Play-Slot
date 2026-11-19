/* ==========================================================================
   PlaySlot - admin.js
   Admin dashboard. All data comes from api.js, so nothing here changes when
   the real API Gateway backend is connected.
   ========================================================================== */

const admin = { venues: [], courts: [], bookings: [], customers: [], charts: {}, scheduleCourtId: null, statusBookingId: null };
const COUNTS_AS_REVENUE = ["Confirmed", "Completed"];
const SECTION_TITLES = {
  dashboard: "Dashboard Overview", bookings: "Manage Bookings", venues: "Manage Venues",
  courts: "Manage Courts", customers: "Customers", reports: "Reports",
};

/* ---------- Load everything, then draw every section ---------- */
async function loadAll() {
  [admin.venues, admin.courts, admin.bookings, admin.customers] =
    await Promise.all([getVenues(), getCourts(), getBookings(), getCustomers()]);
  renderAll();
}

function renderAll() {
  renderDashboard();
  renderBookings();
  renderVenues();
  renderCourtFilter();
  renderCourts();
  renderCustomers();
  renderReports();
}

/* ---------- Navigation & responsive sidebar ---------- */
function showSection(name) {
  document.querySelectorAll(".admin-section").forEach((s) => s.classList.toggle("active", s.id === "sec-" + name));
  document.querySelectorAll(".side-link[data-section]").forEach((b) => b.classList.toggle("active", b.dataset.section === name));
  document.getElementById("sectionTitle").textContent = SECTION_TITLES[name];
  closeSidebar();
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  // Charts need a visible canvas to size correctly, so redraw them when their section opens
  if (name === "dashboard") renderDashboardCharts();
  if (name === "reports") renderReportChart();
  window.scrollTo({ top: 0 });
}
function openSidebar() { document.getElementById("sidebar").classList.add("open"); document.getElementById("sidebarBackdrop").classList.add("show"); }
function closeSidebar() { document.getElementById("sidebar").classList.remove("open"); document.getElementById("sidebarBackdrop").classList.remove("show"); }

/* ---------- Helpers ---------- */
const revenueOf = (list) => list.filter((b) => COUNTS_AS_REVENUE.includes(b.status)).reduce((sum, b) => sum + b.amount, 0);
const venueName = (id) => (admin.venues.find((v) => v.id === id) || { name: "Deleted venue" }).name;

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) days.push(dateOffset(-i));
  return days;
}

function drawChart(canvasId, config) {
  if (admin.charts[canvasId]) admin.charts[canvasId].destroy();
  admin.charts[canvasId] = new Chart(document.getElementById(canvasId), config);
}

/* ==========================================================================
   DASHBOARD OVERVIEW
   ========================================================================== */
function renderDashboard() {
  const b = admin.bookings;
  const today = todayISO();
  const cards = [
    ["Total Bookings", b.length, "bi-journal-check", "bg-s1"],
    ["Today's Bookings", b.filter((x) => x.date === today).length, "bi-calendar-event", "bg-s2"],
    ["Active Bookings", b.filter((x) => ACTIVE_STATUSES.includes(x.status)).length, "bi-activity", "bg-s3"],
    ["Cancelled Bookings", b.filter((x) => x.status === "Cancelled").length, "bi-x-octagon", "bg-s4"],
    ["Total Revenue", formatCurrency(revenueOf(b)), "bi-currency-rupee", "bg-s5"],
  ];
  document.getElementById("statCards").innerHTML = cards.map(([label, value, icon, bg]) => `
    <div class="col-sm-6 col-xl"><div class="stat-card"><div class="stat-icon ${bg}"><i class="bi ${icon}"></i></div>
    <div><div class="value">${value}</div><div class="label">${label}</div></div></div></div>`).join("");

  // Recent bookings (newest created first)
  const recent = [...b].sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 5);
  document.getElementById("recentBookings").innerHTML = recent.map((x) => `
    <tr><td class="fw-semibold">${esc(x.id)}</td><td>${esc(x.customerName)}</td><td>${esc(x.venueName)}</td><td>${formatDate(x.date)}</td><td>${statusBadge(x.status)}</td></tr>`).join("")
    || `<tr><td colspan="5" class="text-center text-muted py-4">No bookings yet.</td></tr>`;

  // Popular venues (most non-cancelled bookings)
  const counts = {};
  b.filter((x) => x.status !== "Cancelled").forEach((x) => { counts[x.venueId] = (counts[x.venueId] || 0) + 1; });
  const top = Object.entries(counts).sort((p, q) => q[1] - p[1]).slice(0, 4);
  const max = top.length ? top[0][1] : 1;
  document.getElementById("popularList").innerHTML = top.map(([id, n]) => `
    <div class="mb-3"><div class="d-flex justify-content-between small mb-1"><span class="fw-semibold">${esc(venueName(id))}</span><span>${n} bookings</span></div>
    <div class="progress"><div class="progress-bar" style="width:${(n / max) * 100}%"></div></div></div>`).join("")
    || `<p class="text-muted">No data yet.</p>`;

  // Status legend
  const statuses = ["Confirmed", "Pending", "Completed", "Cancelled"];
  document.getElementById("statusLegend").innerHTML = statuses.map((s) =>
    `<div class="legend-row"><span>${statusBadge(s)}</span><strong>${b.filter((x) => x.status === s).length}</strong></div>`).join("");

  renderDashboardCharts();
}

function renderDashboardCharts() {
  if (!document.getElementById("sec-dashboard").classList.contains("active")) return;
  const days = lastNDays(7);
  const labels = days.map((d) => formatDate(d).slice(0, 6));
  const perDay = days.map((d) => admin.bookings.filter((x) => x.date === d && x.status !== "Cancelled").length);
  const revPerDay = days.map((d) => revenueOf(admin.bookings.filter((x) => x.date === d)));
  const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

  drawChart("chartBookings", {
    type: "bar",
    data: { labels, datasets: [{ label: "Bookings", data: perDay, backgroundColor: "#22c55e", borderRadius: 6 }] },
    options: { ...baseOpts, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });
  drawChart("chartRevenue", {
    type: "line",
    data: { labels, datasets: [{ label: "Revenue (₹)", data: revPerDay, borderColor: "#0b1f3a", backgroundColor: "rgba(11,31,58,.1)", fill: true, tension: .3, pointBackgroundColor: "#22c55e" }] },
    options: { ...baseOpts, scales: { y: { beginAtZero: true } } },
  });
  const statuses = ["Confirmed", "Pending", "Completed", "Cancelled"];
  drawChart("chartStatus", {
    type: "doughnut",
    data: { labels: statuses, datasets: [{ data: statuses.map((s) => admin.bookings.filter((x) => x.status === s).length), backgroundColor: ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "65%", plugins: { legend: { display: false } } },
  });
}

/* ==========================================================================
   MANAGE BOOKINGS
   ========================================================================== */
function renderBookings() {
  const q = document.getElementById("bkSearch").value.trim().toLowerCase();
  const status = document.getElementById("bkStatus").value;
  const date = document.getElementById("bkDate").value;

  const rows = admin.bookings.filter((b) =>
    (!status || b.status === status) && (!date || b.date === date) &&
    (!q || `${b.id} ${b.customerName} ${b.venueName} ${b.sport}`.toLowerCase().includes(q)));

  document.getElementById("bookingsBody").innerHTML = rows.map((b) => `
    <tr>
      <td class="fw-semibold">${esc(b.id)}</td><td>${esc(b.customerName)}</td>
      <td>${esc(b.venueName)}<div class="small text-muted">${esc(b.courtName)}</div></td>
      <td><span class="chip chip-${esc(b.sport)}">${esc(b.sport)}</span></td>
      <td>${formatDate(b.date)}</td><td>${formatSlot(b.slot)}</td><td>${formatCurrency(b.amount)}</td><td>${statusBadge(b.status)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-navy" data-view="${esc(b.id)}" title="View and update"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-cancel="${esc(b.id)}" title="Cancel booking" ${b.status === "Cancelled" || b.status === "Completed" ? "disabled" : ""}><i class="bi bi-x-circle"></i></button>
      </td>
    </tr>`).join("") || `<tr><td colspan="9" class="text-center text-muted py-5">No bookings match your filters.</td></tr>`;
}

function openBookingModal(id) {
  const b = admin.bookings.find((x) => x.id === id);
  if (!b) return;
  admin.statusBookingId = id;
  document.getElementById("bookingModalTitle").textContent = "Booking " + b.id;
  document.getElementById("bookingDetails").innerHTML = [
    ["Customer", b.customerName], ["Email", b.email], ["Phone", b.phone], ["Venue", b.venueName], ["Court", b.courtName],
    ["Sport", b.sport], ["Date", formatDate(b.date)], ["Time slot", formatSlot(b.slot)], ["Amount", formatCurrency(b.amount)],
    ["Current status", statusBadge(b.status)],
  ].map(([k, v]) => `<div class="summary-row"><span>${k}</span><span>${k === "Current status" ? v : esc(v)}</span></div>`).join("");
  document.getElementById("bookingStatusSelect").value = b.status;
  openModal("bookingModal");
}

async function saveBookingStatus() {
  const status = document.getElementById("bookingStatusSelect").value;
  try {
    await updateBooking(admin.statusBookingId, { status });
    closeModal("bookingModal");
    showToast(`Booking status updated to ${status}.`);
    await loadAll();
  } catch (err) { showToast(err.message, "danger"); }
}

async function cancelFromAdmin(id) {
  const ok = await confirmAction({ title: "Cancel this booking?", message: `Booking ${id} will be marked as Cancelled and the slot will be freed.`, confirmText: "Cancel booking" });
  if (!ok) return;
  try { await cancelBooking(id); showToast("Booking cancelled."); await loadAll(); }
  catch (err) { showToast(err.message, "danger"); }
}

/* ==========================================================================
   MANAGE VENUES
   ========================================================================== */
function renderVenues() {
  document.getElementById("venueCount").textContent = `${admin.venues.length} venues, ${admin.courts.length} courts in total`;
  document.getElementById("venuesBody").innerHTML = admin.venues.map((v) => {
    const n = admin.courts.filter((c) => c.venueId === v.id).length;
    return `<tr>
      <td><div class="d-flex align-items-center gap-2">${imgTag(v.image, v.name, "rounded-3").replace("<img", '<img width="56" height="40" style="object-fit:cover"')}
        <div><div class="fw-semibold">${esc(v.name)}</div><div class="small text-muted">${Number(v.rating).toFixed(1)} rating</div></div></div></td>
      <td><span class="chip chip-${esc(v.sport)}">${esc(v.sport)}</span></td><td>${esc(v.location)}</td>
      <td>${formatCurrency(v.pricePerHour)}</td><td>${n}</td>
      <td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-toggle-venue="${esc(v.id)}" ${v.available ? "checked" : ""} aria-label="Venue availability"></div></td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-navy" data-edit-venue="${esc(v.id)}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-delete-venue="${esc(v.id)}" title="Delete"><i class="bi bi-trash"></i></button>
      </td></tr>`;
  }).join("") || `<tr><td colspan="7" class="text-center text-muted py-5">No venues yet. Add your first venue.</td></tr>`;
}

function openVenueModal(id) {
  const form = document.getElementById("venueForm");
  form.classList.remove("was-validated");
  form.reset();
  const v = id ? admin.venues.find((x) => x.id === id) : null;
  document.getElementById("venueModalTitle").textContent = v ? "Edit venue" : "Add venue";
  document.getElementById("venueId").value = v ? v.id : "";
  document.getElementById("vName").value = v ? v.name : "";
  document.getElementById("vSport").value = v ? v.sport : "";
  document.getElementById("vLocation").value = v ? v.location : "";
  document.getElementById("vPrice").value = v ? v.pricePerHour : "";
  document.getElementById("vImage").value = v ? v.image : "";
  document.getElementById("vDesc").value = v ? v.description : "";
  document.getElementById("vAvailable").checked = v ? v.available : true;
  const courtsInput = document.getElementById("vCourts");
  courtsInput.value = v ? admin.courts.filter((c) => c.venueId === v.id).length : 2;
  courtsInput.disabled = !!v;       // existing venues: courts are managed on the Courts page
  document.getElementById("vCourtsHelp").classList.toggle("d-none", !v);
  openModal("venueModal");
}

async function saveVenue(e) {
  e.preventDefault();
  const form = e.target;
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  const sport = document.getElementById("vSport").value;
  const data = {
    name: document.getElementById("vName").value.trim(),
    sport,
    location: document.getElementById("vLocation").value.trim(),
    pricePerHour: Number(document.getElementById("vPrice").value),
    description: document.getElementById("vDesc").value.trim(),
    image: document.getElementById("vImage").value.trim() || `assets/images/${sport.toLowerCase()}-1.svg`,
    available: document.getElementById("vAvailable").checked,
  };
  const id = document.getElementById("venueId").value;
  try {
    if (id) { await updateVenue(id, data); showToast("Venue updated."); }
    else { data.courts = Number(document.getElementById("vCourts").value); await createVenue(data); showToast("Venue added with its courts."); }
    closeModal("venueModal");
    await loadAll();
  } catch (err) { showToast(err.message, "danger"); }
}

async function removeVenue(id) {
  const v = admin.venues.find((x) => x.id === id);
  const ok = await confirmAction({ title: "Delete this venue?", message: `"${v.name}" and all of its courts will be removed. This cannot be undone.`, confirmText: "Delete venue" });
  if (!ok) return;
  try { await deleteVenue(id); showToast("Venue deleted."); await loadAll(); }
  catch (err) { showToast(err.message, "danger"); }
}

/* ==========================================================================
   MANAGE COURTS
   ========================================================================== */
function renderCourtFilter() {
  const select = document.getElementById("courtVenueFilter");
  const current = select.value;
  select.innerHTML = `<option value="">All venues</option>` + admin.venues.map((v) => `<option value="${esc(v.id)}">${esc(v.name)}</option>`).join("");
  select.value = admin.venues.some((v) => v.id === current) ? current : "";
}

function renderCourts() {
  const venueId = document.getElementById("courtVenueFilter").value;
  const rows = admin.courts.filter((c) => !venueId || c.venueId === venueId);
  document.getElementById("courtsBody").innerHTML = rows.map((c) => {
    const active = admin.bookings.filter((b) => b.courtId === c.id && ACTIVE_STATUSES.includes(b.status)).length;
    return `<tr>
      <td class="fw-semibold">${esc(c.name)}</td><td>${esc(venueName(c.venueId))}</td><td>${esc(c.surface)}</td><td>${active}</td>
      <td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-toggle-court="${esc(c.id)}" ${c.available ? "checked" : ""} aria-label="Court availability"></div></td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-navy" data-schedule="${esc(c.id)}" title="View schedule"><i class="bi bi-calendar3"></i></button>
        <button class="btn btn-sm btn-outline-navy" data-edit-court="${esc(c.id)}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-delete-court="${esc(c.id)}" title="Delete"><i class="bi bi-trash"></i></button>
      </td></tr>`;
  }).join("") || `<tr><td colspan="6" class="text-center text-muted py-5">No courts to show.</td></tr>`;
}

function openCourtModal(id) {
  const form = document.getElementById("courtForm");
  form.classList.remove("was-validated");
  form.reset();
  const c = id ? admin.courts.find((x) => x.id === id) : null;
  document.getElementById("courtModalTitle").textContent = c ? "Edit court" : "Add court";
  document.getElementById("courtId").value = c ? c.id : "";
  document.getElementById("cVenue").innerHTML = `<option value="">Choose venue</option>` + admin.venues.map((v) => `<option value="${esc(v.id)}">${esc(v.name)}</option>`).join("");
  document.getElementById("cVenue").value = c ? c.venueId : document.getElementById("courtVenueFilter").value;
  document.getElementById("cName").value = c ? c.name : "";
  document.getElementById("cSurface").value = c ? c.surface : "";
  document.getElementById("cAvailable").checked = c ? c.available : true;
  openModal("courtModal");
}

async function saveCourt(e) {
  e.preventDefault();
  const form = e.target;
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;
  const id = document.getElementById("courtId").value;
  const data = {
    venueId: document.getElementById("cVenue").value,
    name: document.getElementById("cName").value.trim(),
    surface: document.getElementById("cSurface").value.trim() || "Standard",
    available: document.getElementById("cAvailable").checked,
  };
  try {
    if (id) {
      const old = admin.courts.find((c) => c.id === id);
      const hasActive = admin.bookings.some((b) => b.courtId === id && ACTIVE_STATUSES.includes(b.status));
      if (old.venueId !== data.venueId && hasActive) throw new Error("This court has active bookings. Cancel them before moving it to another venue.");
      await updateCourt(id, data); showToast("Court updated.");
    } else { await createCourt(data); showToast("Court added."); }
    closeModal("courtModal");
    await loadAll();
  } catch (err) { showToast(err.message, "danger"); }
}

async function removeCourt(id) {
  const c = admin.courts.find((x) => x.id === id);
  const ok = await confirmAction({ title: "Delete this court?", message: `${c.name} at ${venueName(c.venueId)} will be removed.`, confirmText: "Delete court" });
  if (!ok) return;
  try { await deleteCourt(id); showToast("Court deleted."); await loadAll(); }
  catch (err) { showToast(err.message, "danger"); }
}

function openSchedule(courtId) {
  admin.scheduleCourtId = courtId;
  const c = admin.courts.find((x) => x.id === courtId);
  document.getElementById("scheduleTitle").textContent = `${c.name} - ${venueName(c.venueId)}`;
  document.getElementById("scheduleDate").value = todayISO();
  renderSchedule();
  openModal("scheduleModal");
}

function renderSchedule() {
  const date = document.getElementById("scheduleDate").value;
  document.getElementById("scheduleGrid").innerHTML = SLOTS.map((slot) => {
    const b = admin.bookings.find((x) => x.courtId === admin.scheduleCourtId && x.date === date && x.slot === slot && ACTIVE_STATUSES.includes(x.status));
    return `<div class="schedule-cell ${b ? "booked" : ""}"><strong>${formatSlot(slot)}</strong>
      ${b ? `${esc(b.customerName)}<br><small class="text-muted">${esc(b.id)}</small>` : `<span class="text-success">Free</span>`}</div>`;
  }).join("");
}

/* ==========================================================================
   CUSTOMERS
   ========================================================================== */
function renderCustomers() {
  const q = document.getElementById("custSearch").value.trim().toLowerCase();
  const rows = admin.customers.filter((c) => !q || `${c.name} ${c.email} ${c.phone} ${c.id}`.toLowerCase().includes(q));
  document.getElementById("customersBody").innerHTML = rows.map((c) => `
    <tr><td class="fw-semibold">${esc(c.id)}</td><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td>
    <td><span class="badge text-bg-light border">${c.totalBookings}</span></td>
    <td class="text-end"><button class="btn btn-sm btn-outline-navy" data-history="${esc(c.id)}">View history</button></td></tr>`).join("")
    || `<tr><td colspan="6" class="text-center text-muted py-5">No customers found.</td></tr>`;
}

function openCustomerHistory(id) {
  const c = admin.customers.find((x) => x.id === id);
  const list = admin.bookings.filter((b) => b.email.toLowerCase() === c.email.toLowerCase());
  document.getElementById("customerTitle").textContent = `${c.name} - booking history`;
  document.getElementById("customerHistory").innerHTML = list.length ? `
    <div class="table-responsive"><table class="table ps-table"><thead><tr><th>ID</th><th>Venue</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th></tr></thead><tbody>
    ${list.map((b) => `<tr><td>${esc(b.id)}</td><td>${esc(b.venueName)}</td><td>${formatDate(b.date)}</td><td>${formatSlot(b.slot)}</td><td>${formatCurrency(b.amount)}</td><td>${statusBadge(b.status)}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="text-muted mb-0">This customer has no bookings yet.</p>`;
  openModal("customerModal");
}

/* ==========================================================================
   REPORTS
   ========================================================================== */
function renderReports() {
  document.getElementById("reportBody").innerHTML = admin.venues.map((v) => {
    const list = admin.bookings.filter((b) => b.venueId === v.id);
    return `<tr><td class="fw-semibold">${esc(v.name)}</td><td>${list.length}</td><td>${list.filter((b) => b.status === "Cancelled").length}</td><td>${formatCurrency(revenueOf(list))}</td></tr>`;
  }).join("") || `<tr><td colspan="4" class="text-center text-muted py-4">No data.</td></tr>`;
  renderReportChart();
}

function renderReportChart() {
  if (!document.getElementById("sec-reports").classList.contains("active")) return;
  const sports = ["Badminton", "Football", "Cricket"];
  drawChart("chartSport", {
    type: "bar",
    data: { labels: sports, datasets: [{ label: "Revenue (₹)", data: sports.map((s) => revenueOf(admin.bookings.filter((b) => b.sport === s))), backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b"], borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function exportBookingsCsv() {
  const header = ["Booking ID", "Customer", "Email", "Phone", "Venue", "Court", "Sport", "Date", "Time slot", "Amount", "Status"];
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = admin.bookings.map((b) => [b.id, b.customerName, b.email, b.phone, b.venueName, b.courtName, b.sport, b.date, formatSlot(b.slot), b.amount, b.status].map(cell).join(","));
  const blob = new Blob([[header.map(cell).join(","), ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `playslot-bookings-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Bookings exported.");
}

/* ==========================================================================
   EVENTS - wired once when the page loads
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Sidebar
  document.querySelectorAll(".side-link[data-section]").forEach((b) => b.addEventListener("click", () => showSection(b.dataset.section)));
  document.getElementById("sidebarToggle").addEventListener("click", openSidebar);
  document.getElementById("sidebarBackdrop").addEventListener("click", closeSidebar);
  document.getElementById("logoutBtn").addEventListener("click", () => openModal("logoutModal"));

  // Filters
  ["bkSearch", "bkStatus", "bkDate"].forEach((id) => document.getElementById(id).addEventListener("input", renderBookings));
  document.getElementById("bkClear").addEventListener("click", () => {
    document.getElementById("bkSearch").value = ""; document.getElementById("bkStatus").value = ""; document.getElementById("bkDate").value = "";
    renderBookings();
  });
  document.getElementById("custSearch").addEventListener("input", renderCustomers);
  document.getElementById("courtVenueFilter").addEventListener("change", renderCourts);
  document.getElementById("scheduleDate").addEventListener("change", renderSchedule);

  // Buttons
  document.getElementById("saveStatusBtn").addEventListener("click", saveBookingStatus);
  document.getElementById("addVenueBtn").addEventListener("click", () => openVenueModal());
  document.getElementById("addCourtBtn").addEventListener("click", () => openCourtModal());
  document.getElementById("venueForm").addEventListener("submit", saveVenue);
  document.getElementById("courtForm").addEventListener("submit", saveCourt);
  document.getElementById("exportCsvBtn").addEventListener("click", exportBookingsCsv);
  document.getElementById("resetDemoBtn").addEventListener("click", async () => {
    const ok = await confirmAction({ title: "Reset demo data?", message: "All bookings, venues, courts and customers will be restored to the original sample data.", confirmText: "Reset data" });
    if (!ok) return;
    await resetDemoData();
    showToast("Demo data restored.");
    await loadAll();
  });

  // Buttons inside tables are created later, so listen on the whole page (event delegation)
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-view],[data-cancel],[data-edit-venue],[data-delete-venue],[data-edit-court],[data-delete-court],[data-schedule],[data-history]");
    if (!t) return;
    const d = t.dataset;
    if (d.view) openBookingModal(d.view);
    if (d.cancel) cancelFromAdmin(d.cancel);
    if (d.editVenue) openVenueModal(d.editVenue);
    if (d.deleteVenue) removeVenue(d.deleteVenue);
    if (d.editCourt) openCourtModal(d.editCourt);
    if (d.deleteCourt) removeCourt(d.deleteCourt);
    if (d.schedule) openSchedule(d.schedule);
    if (d.history) openCustomerHistory(d.history);
  });

  // Availability switches
  document.addEventListener("change", async (e) => {
    const t = e.target;
    try {
      if (t.dataset.toggleVenue) { await updateVenue(t.dataset.toggleVenue, { available: t.checked }); showToast(`Venue ${t.checked ? "opened" : "closed"} for bookings.`); await loadAll(); }
      if (t.dataset.toggleCourt) { await updateCourt(t.dataset.toggleCourt, { available: t.checked }); showToast(`Court ${t.checked ? "enabled" : "disabled"}.`); await loadAll(); }
    } catch (err) { showToast(err.message, "danger"); t.checked = !t.checked; }
  });

  // Start on the section in the URL (e.g. admin.html#bookings)
  const start = location.hash.replace("#", "");
  loadAll().then(() => { if (SECTION_TITLES[start]) showSection(start); });
});
