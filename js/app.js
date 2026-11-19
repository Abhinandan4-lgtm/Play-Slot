/* ==========================================================================
   PlaySlot - app.js
   Shared helpers used on every page: navbar, footer, toasts, formatting.
   Load order on every page: api.js -> app.js -> page script.
   ========================================================================== */

/* ---------- Formatting helpers ---------- */
function formatCurrency(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// "18:00-19:00" -> "6:00 PM - 7:00 PM"
function formatSlot(slot) {
  if (!slot) return "-";
  const to12 = (t) => {
    const h = Number(t.split(":")[0]);
    return `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? "PM" : "AM"}`;
  };
  const [a, b] = slot.split("-");
  return `${to12(a)} - ${to12(b)}`;
}

// Stops user-typed text from being treated as HTML (basic XSS protection)
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function statusBadge(status) {
  return `<span class="status status-${esc(status)}">${esc(status)}</span>`;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Image tag that falls back to a placeholder if the URL is broken
function imgTag(src, alt, cls = "") {
  return `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">`;
}

// Is this date + slot already in the past? (used to block old slots)
function isPastSlot(dateISO, slot) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const startHour = Number(slot.split(":")[0]);
  return new Date(y, m - 1, d, startHour, 0) <= new Date();
}

/* ---------- Toast notifications ---------- */
function showToast(message, type = "success") {
  let stack = document.getElementById("toastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const colors = { success: "text-bg-success", danger: "text-bg-danger", warning: "text-bg-warning", info: "text-bg-primary" };
  const icons = { success: "check-circle-fill", danger: "exclamation-octagon-fill", warning: "exclamation-triangle-fill", info: "info-circle-fill" };
  const el = document.createElement("div");
  el.className = `toast align-items-center ${colors[type] || colors.info}`;
  el.setAttribute("role", "alert");
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${icons[type] || icons.info} me-2"></i>${esc(message)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  stack.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 3500 });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  toast.show();
}

/* ---------- Modal helpers ---------- */
function openModal(id) { bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show(); }
function closeModal(id) { bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).hide(); }

// Generic "Are you sure?" dialog. Needs #confirmModal on the page.
function confirmAction({ title, message, confirmText = "Confirm", danger = true }) {
  return new Promise((resolve) => {
    const modalEl = document.getElementById("confirmModal");
    modalEl.querySelector(".modal-title").textContent = title;
    modalEl.querySelector(".confirm-message").textContent = message;
    const okBtn = modalEl.querySelector(".confirm-ok");
    okBtn.textContent = confirmText;
    okBtn.className = `btn confirm-ok ${danger ? "btn-danger" : "btn-green"}`;
    let answered = false;
    const done = (value) => { if (!answered) { answered = true; resolve(value); } };
    okBtn.onclick = () => { done(true); closeModal("confirmModal"); };
    modalEl.addEventListener("hidden.bs.modal", () => done(false), { once: true });
    openModal("confirmModal");
  });
}

/* Standard confirm modal markup, injected on pages that include <div id="confirmHost"> */
function renderConfirmModal() {
  const host = document.getElementById("confirmHost");
  if (!host) return;
  host.innerHTML = `
  <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content border-0 rounded-4">
      <div class="modal-header border-0 pb-0"><h5 class="modal-title"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body confirm-message text-secondary"></div>
      <div class="modal-footer border-0 pt-0">
        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Keep it</button>
        <button type="button" class="btn btn-danger confirm-ok">Confirm</button>
      </div>
    </div></div>
  </div>`;
}

/* ---------- Navbar & footer (shared by all customer pages) ---------- */
function renderNavbar() {
  const host = document.getElementById("site-navbar");
  if (!host) return;
  const page = document.body.dataset.page;
  const links = [
    ["home", "index.html", "Home"],
    ["venues", "venues.html", "Venues"],
    ["my-bookings", "my-bookings.html", "My Bookings"],
  ];
  host.innerHTML = `
  <nav class="navbar navbar-expand-lg ps-navbar">
    <div class="container">
      <a class="brand" href="index.html"><span class="brand-mark"><i class="bi bi-lightning-charge-fill"></i></span>Play<span class="accent">Slot</span></a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span></button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
          ${links.map(([key, href, label]) => `<li class="nav-item"><a class="nav-link ${page === key ? "active" : ""}" href="${href}">${label}</a></li>`).join("")}
          <li class="nav-item ms-lg-2 mt-2 mt-lg-0"><a class="btn btn-green btn-sm px-3" href="venues.html">Book a slot</a></li>
          <li class="nav-item ms-lg-1 mt-2 mt-lg-0"><a class="nav-link" href="admin.html"><i class="bi bi-speedometer2 me-1"></i>Admin</a></li>
        </ul>
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  const host = document.getElementById("site-footer");
  if (!host) return;
  host.innerHTML = `
  <footer class="site-footer">
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-4">
          <a class="brand mb-3" href="index.html"><span class="brand-mark"><i class="bi bi-lightning-charge-fill"></i></span>Play<span class="accent">Slot</span></a>
          <p class="mt-3 mb-0">Book badminton courts, football turfs and cricket grounds near you in a few taps.</p>
        </div>
        <div class="col-6 col-lg-2"><h6>Explore</h6>
          <ul><li><a href="index.html">Home</a></li><li><a href="venues.html">All venues</a></li>
          <li><a href="my-bookings.html">My bookings</a></li><li><a href="admin.html">Admin dashboard</a></li></ul></div>
        <div class="col-6 col-lg-2"><h6>Sports</h6>
          <ul><li><a href="venues.html?sport=Badminton">Badminton</a></li><li><a href="venues.html?sport=Football">Football turf</a></li>
          <li><a href="venues.html?sport=Cricket">Cricket turf</a></li></ul></div>
        <div class="col-lg-4"><h6>Contact</h6>
          <ul><li><i class="bi bi-geo-alt me-2"></i>12 MG Road, Bengaluru, Karnataka</li>
          <li><i class="bi bi-telephone me-2"></i>+91 80 4000 1234</li>
          <li><i class="bi bi-envelope me-2"></i>support@playslot.example</li></ul></div>
      </div>
      <div class="footer-bottom d-flex flex-wrap justify-content-between gap-2">
        <span>&copy; ${new Date().getFullYear()} PlaySlot. Demo project.</span>
        <span>Frontend demo: data is stored in your browser only.</span>
      </div>
    </div>
  </footer>`;
}

/* Run on every page */
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  renderFooter();
  renderConfirmModal();
});
