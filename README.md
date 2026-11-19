<div align="center">

# 🏟️ PlaySlot

### Find your game. Book your slot.

**A responsive sports venue discovery and court-booking web application with a dedicated admin dashboard.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?logo=bootstrap&logoColor=white) ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?logo=githubpages&logoColor=white)

[**Live Demo**](https://YOUR_USERNAME.github.io/playslot/) · [**Report an Issue**](../../issues)

</div>

> **Demo status:** The default configuration uses browser-local sample data. The optional AWS API Gateway integration requires a separately deployed backend and is not enabled in the public demo.

## Overview

**PlaySlot** simplifies the experience of discovering sports venues and reserving courts through an intuitive booking flow. Users can browse venues, narrow their choices using filters, select a court and time slot, and manage their bookings. A separate administrative interface provides tools to explore booking activity and manage demo venue data.

The project focuses on responsive UI design, practical client-side state management, and an end-to-end reservation workflow.

## Features

| Player experience | Admin dashboard (demo) |
| --- | --- |
| Browse sports venues | View dashboard summaries and charts |
| Filter by sport, location, and price | Manage venues and courts |
| Select a court, date, and time slot | View and manage bookings |
| Enter details and confirm a booking | Explore customer information |
| Find bookings by email and cancel them | Export CSV reports and reset demo data |

## Screenshots

<!-- Add real screenshots to docs/screenshots/ before uncommenting these lines. -->
<!-- ![Homepage](docs/screenshots/homepage.png) -->
<!-- ![Venue discovery](docs/screenshots/venues.png) -->
<!-- ![Booking flow](docs/screenshots/booking.png) -->
<!-- ![Admin dashboard](docs/screenshots/admin.png) -->

*Screenshots will be added after the deployed interface is verified.*

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, Bootstrap 5, Bootstrap Icons |
| Application logic | Vanilla JavaScript |
| Data visualization | Chart.js |
| Demo storage | Browser `localStorage` |
| Optional API integration | AWS API Gateway through `fetch()` |
| Hosting | GitHub Pages (static frontend) |

## Project structure

```text
playslot/
├── index.html                # Home page
├── venues.html               # Venue browsing and filters
├── booking.html              # Court and time-slot booking
├── my-bookings.html          # Booking lookup and cancellation
├── admin.html                # Admin demo dashboard
├── css/
│   └── style.css             # Shared styling
├── js/
│   ├── api.js                # Data access and API configuration
│   ├── app.js                # Shared UI utilities
│   ├── venues.js             # Venue discovery logic
│   ├── booking.js            # Booking workflow
│   └── admin.js              # Dashboard logic
├── assets/images/            # SVG illustrations
├── .github/workflows/        # GitHub Pages deployment workflow
├── SECURITY.md               # Security notes
└── README.md
```

## Getting started

**Prerequisites:** A modern web browser and Python 3 (or a local development server such as VS Code Live Server). No package installation or build step is required.

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/playslot.git
   cd playslot
   ```

2. Start a local server:

   ```bash
   python -m http.server 8000
   ```

3. Visit **http://localhost:8000**.

   On Windows, `py -m http.server 8000` is an alternative. An internet connection is needed for the Bootstrap and Chart.js CDN assets.

## How to use

1. Open **Venues** and browse or filter the available options.
2. Choose a venue, court, date, and available time slot.
3. Enter booking details and confirm the reservation.
4. Use **My Bookings** to find and cancel demo bookings with the same email address.
5. Visit **Admin** to explore the dashboard, data management, and reporting tools.

## Application architecture

```text
Browser (HTML + CSS + JavaScript)
             │
             ▼
        js/api.js
             │
       ┌─────┴───────────────┐
       ▼                     ▼
Browser localStorage    AWS API Gateway
(default demo mode)     (optional integration)
                             │
                      Backend not included
```

### Demo mode vs. AWS integration

The included `js/api.js` supports separate settings for local demo data and AWS-backed bookings:

```js
USE_LOCAL_DEMO: true,
USE_AWS_BOOKINGS: false
```

The shipped public-demo configuration keeps bookings in `localStorage`. Data is specific to each browser and is **not synchronized between users or devices**. The project includes an AWS API Gateway integration path, but the backend code is not part of this repository and its availability has not been verified.

**Do not use the demo for real customer data.** Email-based lookup is not authentication, and the admin page is not access-controlled. Before enabling real bookings, implement server-side authorization, input validation, and atomic slot reservations.

## Deploy to GitHub Pages

1. Push the project to a GitHub repository, keeping `index.html` in the root folder.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. The included workflow in `.github/workflows/` deploys the static site on pushes to `main`.
5. Check the **Actions** tab for deployment status and copy the published URL into this README and the repository's **About** section.

The typical URL format is `https://YOUR_USERNAME.github.io/playslot/`.

## Limitations and next steps

- [ ] Add authenticated player and admin accounts.
- [ ] Integrate a persistent backend and shared database.
- [ ] Prevent concurrent double-booking on the server.
- [ ] Add automated tests and deployment checks.
- [ ] Introduce real booking notifications and payment handling, if required.
- [ ] Add verified screenshots and a short product walkthrough.

## Security

This is a **portfolio/demo project**, not a production reservation system. The admin interface is publicly accessible in demo mode, and browser-local data can be viewed or modified by the user. See [SECURITY.md](SECURITY.md) for more information.

## License

No license is currently included. Unless a license is added, the repository does not grant general permission to reuse or redistribute its source code.

---

<div align="center"><strong>PlaySlot — Find your game. Book your slot.</strong></div>
