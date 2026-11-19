# PlaySlot - Sports Turf & Badminton Court Booking (Frontend)

Pure HTML5 + CSS3 + Vanilla JavaScript + Bootstrap 5 (CDN). No Node.js, no build step, no backend.
Demo data lives in your browser's localStorage.

## Folder structure
```
playslot/
├── index.html         Home: hero, search, featured sports, popular venues, how it works
├── venues.html        All venues with search, sport / location / price filters, availability
├── booking.html       Court + date + slot picker, customer form, summary, confirmation modal
├── my-bookings.html   Bookings by email, cancel button, empty state
├── admin.html         Admin dashboard (sidebar: overview, bookings, venues, courts, customers, reports)
├── css/style.css      Theme (navy / white / green), cards, slots, sidebar, responsive rules
├── js/
│   ├── api.js         DATA LAYER. Every read/write goes through here. localStorage now, fetch() later
│   ├── app.js         Shared helpers: navbar, footer, toasts, modals, formatting
│   ├── venues.js      Home page + venue listing logic
│   ├── booking.js     Booking page + My Bookings logic
│   └── admin.js       Admin dashboard logic, Chart.js charts, CRUD, CSV export
└── assets/images/     Court illustrations (SVG) used by sample venues
```
Script order on every page: `api.js` -> `app.js` -> page script.

## Run it
No installs are required. Bootstrap, Bootstrap Icons, Google Fonts and Chart.js load from CDNs, so you need an internet connection.

**Quickest (Windows or Linux):** double-click `index.html`.

**Recommended (local server):**
- Windows (PowerShell / CMD): `cd path\to\playslot` then `py -m http.server 8000`
- Linux / macOS: `cd path/to/playslot && python3 -m http.server 8000`
- Open http://localhost:8000
- Alternative: VS Code + "Live Server" extension -> right-click `index.html` -> Open with Live Server.

## Test the booking flow
1. Open `index.html`, choose a sport and click **Search venues** (or open `venues.html`).
2. Click **Book Now** on a venue.
3. Pick a court and a date, then an available slot (greyed slots are booked or in the past).
4. Fill in name, 10-digit phone and email. Leave a field empty to see validation.
5. Click **Confirm booking**. The modal shows the booking ID (e.g. `PS-20261104-K7Q2`).
6. Go back to the same court, date and time: that slot is now disabled.
7. Open **My Bookings** (it uses the email you just booked with) and cancel the booking.
   Demo customers: `aarav.sharma@example.com`, `priya.nair@example.com`, ...
8. Open `admin.html` and see the new booking in Manage Bookings and the dashboard numbers.

## Admin dashboard
Open `admin.html` (also linked as **Admin** in the navbar/footer). There is no login in this phase; **Logout** returns you to the site.
Use **Reset demo data** (top bar) to restore the original sample data at any time.
Open a section directly with `admin.html#bookings`, `#venues`, `#courts`, `#customers`, `#reports`.

## Connecting to AWS API Gateway (next phase)
Only `js/api.js` needs to change.

1. Deploy API Gateway (REST) + Lambda (Python) + DynamoDB and enable **CORS** for your site's origin.
2. In `js/api.js` set:
   ```js
   const API_CONFIG = { BASE_URL: "https://<id>.execute-api.<region>.amazonaws.com/prod", USE_LOCAL_DEMO: false };
   ```
3. `apiRequest()` already uses `fetch()` and the same function names. Routes it expects:

| Function | Method and path |
|---|---|
| getVenues / getVenueById | GET `/venues`, GET `/venues/{id}` |
| createVenue / updateVenue / deleteVenue | POST `/venues`, PUT `/venues/{id}`, DELETE `/venues/{id}` |
| getBookings (filters as query string) | GET `/bookings?email=&venueId=&courtId=&date=&status=` |
| getBookingById | GET `/bookings/{id}` |
| createBooking | POST `/bookings` (Lambda must reject a duplicate court + date + slot with HTTP 409 and a `message`) |
| updateBooking | PUT `/bookings/{id}` |
| cancelBooking | POST `/bookings/{id}/cancel` |
| getCourts / createCourt / updateCourt / deleteCourt | GET `/courts?venueId=`, POST `/courts`, PUT/DELETE `/courts/{id}` |
| getCustomers | GET `/customers` |

4. Move the "no double booking" rule into Lambda using a DynamoDB conditional write
   (e.g. key `courtId#date#slot` with `attribute_not_exists`). Add authentication
   (Cognito) before exposing the admin routes.
5. Error handling already works: Lambda returns `{ "message": "..." }` and the UI shows it as a toast.
