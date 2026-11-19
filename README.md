<div align="center">

# 🏟️ PlaySlot

### Find your court. Pick your time. Get in the game. ⚡

**A simpler way to discover sports venues, reserve courts, and manage bookings — all in one place.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Open_PlaySlot-2563eb?style=for-the-badge)](https://Abhinandan4-lgtm.github.io/Play-Slot/)
[![GitHub](https://img.shields.io/badge/⭐_Repository-Play--Slot-24292f?style=for-the-badge&logo=github)](https://github.com/Abhinandan4-lgtm/Play-Slot)

</div>

---

## 🎯 Why PlaySlot?

Planning a game should be fun. **Booking a court shouldn't be the hard part.**

Players often have to contact venues individually, ask about availability, compare options, and coordinate reservations. Venue operators, meanwhile, need a clear way to organize courts, customers, and bookings.

**💡 PlaySlot brings the whole journey into one straightforward booking experience:** discover a venue → choose a court → select a slot → confirm your booking.

## ✨ What Can You Do?

| 🙋 For players | 🧑‍💼 For venue managers |
| --- | --- |
| 🔎 Explore venues for **badminton, football, and cricket** | 📊 See booking activity on a dashboard |
| 🎛️ Narrow down options using venue filters | 🏟️ Manage venues and courts |
| 📅 Choose a court, date, and available time slot | 📋 Review and update reservations |
| ✅ Submit a reservation | 👥 View customer booking information |
| 🧾 Look up bookings and cancel when needed | 📥 Export booking reports as CSV |

## 🏸 How It Works

**1. 🔍 Explore** — Browse venues and find a sport or location that suits you.

**2. 🏟️ Choose** — Open a venue and select the court you want.

**3. 🕒 Schedule** — Pick a date and an available time slot.

**4. ✅ Book** — Enter your details and confirm the reservation.

**5. 📋 Manage** — Visit **My Bookings** to look up your reservations and cancel one if needed.

> 🧑‍💼 **Running a venue?** Open the **Admin** page to explore the dashboard, court management, reservations, customers, and reports.

## 🚀 Get Started in Minutes

### Option A — Try the website

👉 **[Open the PlaySlot demo](https://Abhinandan4-lgtm.github.io/Play-Slot/)**

*The link works after GitHub Pages is enabled and successfully deployed for this repository.*

### Option B — Clone and run locally

**1. Clone the repository**

```bash
git clone https://github.com/Abhinandan4-lgtm/Play-Slot.git
```

**2. Open the project**

```bash
cd Play-Slot
```

**3. Start a local web server** (Python 3)

```bash
python -m http.server 8000
```

**4. Visit** **http://localhost:8000** in your browser.

> 💡 No database setup or API keys are required for the default demo. The app uses sample venue data and browser `localStorage`.

## ⚙️ What Should You Replace or Configure?

| Item | What to do |
| --- | --- |
| 🔗 **GitHub links** | Already set to [`Abhinandan4-lgtm/Play-Slot`](https://github.com/Abhinandan4-lgtm/Play-Slot). Update only if you fork or rename the repo. |
| 🌐 **Live demo URL** | Already set to `https://Abhinandan4-lgtm.github.io/Play-Slot/`. Enable **Settings → Pages → GitHub Actions** to publish it, if the Pages workflow is present. |
| 🖼️ **Screenshots** | Add your own screenshots of the homepage, venue selection, booking page, and admin dashboard if you'd like to showcase the UI. |
| 🏟️ **Demo venues and courts** | Replace the sample venue/court entries in `js/api.js` with your own demo data if needed. |
| ☁️ **AWS API (optional)** | In `js/api.js`, replace `API_CONFIG.BASE_URL` with **your own deployed API Gateway URL**. Only set `USE_LOCAL_DEMO: false` and/or `USE_AWS_BOOKINGS: true` when the corresponding backend endpoints are implemented, deployed, and tested. |

**Default demo configuration** in `js/api.js`:

```js
const API_CONFIG = {
  BASE_URL: "YOUR_API_GATEWAY_URL", // Only needed for AWS mode
  USE_LOCAL_DEMO: true,
  USE_AWS_BOOKINGS: false,
};
```

*This is a configuration example, not a change you must make to run the demo. Leave the existing URL and flags alone if you're using the local demo.*

## 🌟 Why It Matters

PlaySlot is designed around a simple goal: **less time coordinating a court, more time playing.** It demonstrates a complete player booking journey alongside the management tools that venue operators need to organize their reservations.

> ⚠️ **Demo note:** With the default browser-local mode, bookings are stored on the current device/browser and are not shared across users. The admin interface is a demonstration, not a secured production admin portal. Real multi-user availability and booking management require a deployed backend, authentication, and server-side validation.

---

<div align="center">

### 🏁 Ready to play?

**[Explore PlaySlot](https://Abhinandan4-lgtm.github.io/Play-Slot/)** · **[View the repository](https://github.com/Abhinandan4-lgtm/Play-Slot)**

Made by **[Abhinandan4-lgtm](https://github.com/Abhinandan4-lgtm)** 💙

</div>
