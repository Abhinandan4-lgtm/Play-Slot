<div align="center">🏟️ PlaySlot
Find a venue. Pick a time. Play your game.
A sports venue discovery and court-booking web app that makes finding and reserving playing spaces simpler.

Explore the Code · Report an Issue
</div>The problem
Booking a sports court often means contacting venues individually, comparing locations and prices, and coordinating available times. Venue operators also need a practical way to keep track of courts and reservations.

PlaySlot brings venue discovery, slot selection, and booking management into one interface. Players can find a suitable place to play, while administrators can review and manage booking activity from a separate dashboard.
What PlaySlot does
For players
- Discover venues: Browse sports facilities and filter options by sport, location, and price.
- Choose a slot: Select a venue, court, date, and available time slot.
- Reserve a court: Enter booking details and confirm a reservation.
- Manage bookings: Look up reservations using the booking email and cancel when needed.
For administrators
- View booking activity and dashboard summaries.
- Manage demo venue and court information.
- Review bookings and customer records.
- Export reports as CSV.
How to use it
1. Open the application and select Explore Venues.
2. Browse facilities or narrow the results using filters.
3. Choose a venue and an available court.
4. Pick a date and time slot, then enter your details to confirm.
5. Open My Bookings to view or cancel your reservation using the same email address.
The Admin page provides a separate interface for viewing and managing demo booking data.
Run locally
No framework installation or build process is required.
git clone https://github.com/Abhinandan4-lgtm/Play-Slot.git
cd Play-Slot
python -m http.server 8000
Open http://localhost:8000 in your browser. On Windows, you can use py -m http.server 8000 instead. Internet access is required for externally hosted UI libraries.
Built with
Technology	Role
HTML5, CSS3	Page structure and responsive styling
JavaScript	Venue filtering, booking flow, and application logic
Bootstrap 5 & Bootstrap Icons	Interface components and icons
Chart.js	Admin dashboard charts
Browser localStorage	Demo venue and booking data
AWS API Gateway integration	Optional remote booking integration; backend not included


Project structure
Play-Slot/
├── index.html             # Home page
├── venues.html            # Browse and filter venues
├── booking.html           # Court reservation flow
├── my-bookings.html       # Find and manage reservations
├── admin.html             # Administrative dashboard
├── css/style.css          # Shared styles
├── js/
│   ├── api.js             # Data access and API configuration
│   ├── app.js             # Shared UI behavior
│   ├── venues.js          # Venue discovery
│   ├── booking.js         # Booking flow
│   └── admin.js           # Dashboard behavior
└── assets/images/         # Illustrations
Demo scope
The GitHub-ready demo configuration stores data in the visitor's browser localStorage. This makes the core flow easy to explore without setting up a server, but bookings are not shared across browsers or devices.

The code also includes an optional AWS API Gateway booking integration. The backend implementation is not included in this repository, so this README does not present it as an active hosted service.

PlaySlot is a portfolio demonstration, not a production booking service. The demo admin page is not protected by authentication, and email-based booking lookup is not identity verification. Do not enter real customer information.
Next steps
- Add authenticated user and administrator accounts.
- Connect a persistent backend with conflict-safe slot reservations.
- Add automated booking confirmations and tests.
- Publish verified screenshots and a live demo URL.
<div align="center">Built by Abhinandan

PlaySlot — Less planning. More playing.
</div>
