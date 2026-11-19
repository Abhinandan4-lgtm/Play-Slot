/* ==========================================================================
   PlaySlot - api.js
   The ONLY file that talks to data storage.
   ========================================================================== */

/* ---------- 1. Configuration ---------- */

const API_CONFIG = {
  BASE_URL: "https://l11m01t37i.execute-api.us-east-1.amazonaws.com/prod",
  USE_LOCAL_DEMO: true,
  USE_AWS_BOOKINGS: true,
};

/* ---------- 2. Shared constants ---------- */

const SLOT_START_HOUR = 6;
const SLOT_END_HOUR = 23;
const SLOTS = [];

for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
  const p = (n) => String(n).padStart(2, "0");
  SLOTS.push(`${p(h)}:00-${p(h + 1)}:00`);
}

const ACTIVE_STATUSES = ["Confirmed", "Pending"];

/* ---------- 3. Date helpers ---------- */

function toISODate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/* ==========================================================================
   4. LOCAL DEMO IMPLEMENTATION
   ========================================================================== */

const KEYS = {
  venues: "playslot_venues",
  courts: "playslot_courts",
  bookings: "playslot_bookings",
  customers: "playslot_customers",
};

function dbRead(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function dbWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 5)}`.toUpperCase();
}

/* ----- Sample data ----- */

function seedDemoData() {
  if (localStorage.getItem(KEYS.venues)) return;

  const venues = [
    {
      id: "v1",
      name: "Smash Arena",
      sport: "Badminton",
      location: "Koramangala",
      pricePerHour: 450,
      rating: 4.8,
      available: true,
      image: "assets/images/badminton-1.svg",
      description: "Six-lamp wooden courts with anti-glare lighting, a pro shop and racquet rental at the counter.",
    },
    {
      id: "v2",
      name: "Shuttle Hub Indoor Courts",
      sport: "Badminton",
      location: "Indiranagar",
      pricePerHour: 500,
      rating: 4.6,
      available: true,
      image: "assets/images/badminton-2.svg",
      description: "Air-conditioned synthetic courts, spectator seating and a small cafe next to the lobby.",
    },
    {
      id: "v3",
      name: "GreenKick Football Turf",
      sport: "Football",
      location: "HSR Layout",
      pricePerHour: 1500,
      rating: 4.7,
      available: true,
      image: "assets/images/football-1.svg",
      description: "FIFA-grade 5-a-side turf under floodlights with changing rooms and drinking water.",
    },
    {
      id: "v4",
      name: "Striker's Park",
      sport: "Football",
      location: "Whitefield",
      pricePerHour: 1800,
      rating: 4.5,
      available: true,
      image: "assets/images/football-2.svg",
      description: "Large 7-a-side turfs with spectator stands, parking and first-aid on site.",
    },
    {
      id: "v5",
      name: "Pitch Perfect Cricket Turf",
      sport: "Cricket",
      location: "Electronic City",
      pricePerHour: 1200,
      rating: 4.4,
      available: true,
      image: "assets/images/cricket-1.svg",
      description: "Box-cricket turf with net walls, a bowling machine on request and night lighting.",
    },
    {
      id: "v6",
      name: "Champions Cricket Arena",
      sport: "Cricket",
      location: "Yelahanka",
      pricePerHour: 1400,
      rating: 4.6,
      available: true,
      image: "assets/images/cricket-2.svg",
      description: "Full-length practice pitches with turf and matting lanes, popular with weekend leagues.",
    },
    {
      id: "v7",
      name: "Baseline Badminton Academy",
      sport: "Badminton",
      location: "Jayanagar",
      pricePerHour: 400,
      rating: 4.3,
      available: true,
      image: "assets/images/badminton-3.svg",
      description: "Coaching-friendly wooden courts with a quiet practice hall and shuttle vending.",
    },
  ];

  const courtCounts = {
    v1: 4,
    v2: 3,
    v3: 2,
    v4: 3,
    v5: 2,
    v6: 2,
    v7: 4,
  };

  const courts = [];

  venues.forEach((v) => {
    for (let n = 1; n <= courtCounts[v.id]; n++) {
      courts.push(makeCourt(v, n));
    }
  });

  const customers = [
    { id: "CUST-1001", name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "9845012345" },
    { id: "CUST-1002", name: "Priya Nair", email: "priya.nair@example.com", phone: "9886123456" },
    { id: "CUST-1003", name: "Rohan Mehta", email: "rohan.mehta@example.com", phone: "9900234567" },
    { id: "CUST-1004", name: "Sneha Iyer", email: "sneha.iyer@example.com", phone: "9740345678" },
    { id: "CUST-1005", name: "Karthik Reddy", email: "karthik.reddy@example.com", phone: "9591456789" },
    { id: "CUST-1006", name: "Ananya Das", email: "ananya.das@example.com", phone: "9620567890" },
  ];

  // [dayOffset, venueId, courtNumber, slot, status, customerIndex]

  const plan = [
    [-9, "v1", 1, "18:00-19:00", "Completed", 0],
    [-7, "v3", 1, "20:00-21:00", "Completed", 1],
    [-6, "v5", 2, "19:00-20:00", "Completed", 2],
    [-5, "v2", 2, "07:00-08:00", "Cancelled", 3],
    [-4, "v4", 1, "21:00-22:00", "Completed", 4],
    [-3, "v1", 3, "19:00-20:00", "Completed", 5],
    [-2, "v6", 1, "18:00-19:00", "Completed", 0],
    [-1, "v3", 2, "22:00-23:00", "Completed", 1],
    [0, "v1", 1, "20:00-21:00", "Confirmed", 2],
    [0, "v4", 2, "19:00-20:00", "Confirmed", 3],
    [1, "v2", 1, "18:00-19:00", "Pending", 4],
    [2, "v5", 1, "20:00-21:00", "Confirmed", 5],
    [3, "v7", 2, "06:00-07:00", "Confirmed", 0],
    [4, "v3", 1, "19:00-20:00", "Cancelled", 1],
    [5, "v1", 2, "18:00-19:00", "Confirmed", 0],
  ];

  const bookings = plan.map((p, i) => {
    const [offset, vid, courtNo, slot, status, ci] = p;

    const v = venues.find((x) => x.id === vid);

    const c = courts.find(
      (x) => x.venueId === vid && x.name.endsWith(" " + courtNo)
    );

    const date = dateOffset(offset);

    return {
      id: `PS-${date.replace(/-/g, "")}-S${String(i + 1).padStart(3, "0")}`,
      venueId: v.id,
      venueName: v.name,
      sport: v.sport,
      courtId: c.id,
      courtName: c.name,
      customerName: customers[ci].name,
      email: customers[ci].email,
      phone: customers[ci].phone,
      date,
      slot,
      amount: v.pricePerHour,
      status,
      createdAt: new Date(
        Date.now() + (offset - 2) * 86400000
      ).toISOString(),
    };
  });

  dbWrite(KEYS.venues, venues);
  dbWrite(KEYS.courts, courts);
  dbWrite(KEYS.customers, customers);
  dbWrite(KEYS.bookings, bookings);
}

/* ----- Court helper ----- */

function makeCourt(venue, number, extra) {
  const label = {
    Badminton: "Court",
    Football: "Turf",
    Cricket: "Pitch",
  }[venue.sport] || "Court";

  const surface = {
    Badminton: "Wooden",
    Football: "Artificial turf",
    Cricket: "Turf / matting",
  }[venue.sport] || "Standard";

  return Object.assign(
    {
      id: `${venue.id}-c${number}-${Math.random().toString(36).slice(2, 5)}`,
      venueId: venue.id,
      name: `${label} ${number}`,
      surface,
      available: true,
    },
    extra || {}
  );
}

/* ----- Booking conflict helper ----- */

function hasConflict(bookings, b, ignoreId) {
  return bookings.some(
    (x) =>
      x.id !== ignoreId &&
      ACTIVE_STATUSES.includes(x.status) &&
      x.courtId === b.courtId &&
      x.date === b.date &&
      x.slot === b.slot
  );
}

function generateBookingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return `PS-${todayISO().replace(/-/g, "")}-${code}`;
}

/* ==========================================================================
   LOCAL DEMO DATABASE OPERATIONS
   ========================================================================== */

const LocalDemo = {

  /* ----- Venues ----- */

  getVenues: () => dbRead(KEYS.venues),

  getVenueById: (id) =>
    dbRead(KEYS.venues).find((v) => v.id === id) || null,

  createVenue(data) {
    const venues = dbRead(KEYS.venues);

    const venue = {
      id: newId("V").toLowerCase(),
      rating: 4.0,
      available: true,
      ...data,
      pricePerHour: Number(data.pricePerHour),
    };

    const count = Math.max(1, Number(data.courts) || 1);

    delete venue.courts;

    venues.push(venue);

    const courts = dbRead(KEYS.courts);

    for (let n = 1; n <= count; n++) {
      courts.push(makeCourt(venue, n));
    }

    dbWrite(KEYS.venues, venues);
    dbWrite(KEYS.courts, courts);

    return venue;
  },

  updateVenue(id, changes) {
    const venues = dbRead(KEYS.venues);

    const i = venues.findIndex((v) => v.id === id);

    if (i < 0) throw new Error("Venue not found.");

    const clean = { ...changes };

    delete clean.courts;

    if (clean.pricePerHour !== undefined) {
      clean.pricePerHour = Number(clean.pricePerHour);
    }

    venues[i] = { ...venues[i], ...clean };

    dbWrite(KEYS.venues, venues);

    return venues[i];
  },

  deleteVenue(id) {
    const hasActive = dbRead(KEYS.bookings).some(
      (b) => b.venueId === id && ACTIVE_STATUSES.includes(b.status)
    );

    if (hasActive) {
      throw new Error(
        "This venue has active bookings. Cancel them before deleting the venue."
      );
    }

    dbWrite(
      KEYS.venues,
      dbRead(KEYS.venues).filter((v) => v.id !== id)
    );

    dbWrite(
      KEYS.courts,
      dbRead(KEYS.courts).filter((c) => c.venueId !== id)
    );

    return { deleted: true };
  },

  /* ----- Courts ----- */

  getCourts: (venueId) =>
    dbRead(KEYS.courts).filter(
      (c) => !venueId || c.venueId === venueId
    ),

  createCourt(data) {
    const venue = LocalDemo.getVenueById(data.venueId);

    if (!venue) throw new Error("Please choose a valid venue.");

    const courts = dbRead(KEYS.courts);

    const court = makeCourt(venue, 0, {
      name: data.name,
      surface: data.surface || "Standard",
      available: data.available !== false,
    });

    courts.push(court);

    dbWrite(KEYS.courts, courts);

    return court;
  },

  updateCourt(id, changes) {
    const courts = dbRead(KEYS.courts);

    const i = courts.findIndex((c) => c.id === id);

    if (i < 0) throw new Error("Court not found.");

    courts[i] = { ...courts[i], ...changes };

    dbWrite(KEYS.courts, courts);

    return courts[i];
  },

  deleteCourt(id) {
    const hasActive = dbRead(KEYS.bookings).some(
      (b) => b.courtId === id && ACTIVE_STATUSES.includes(b.status)
    );

    if (hasActive) {
      throw new Error("This court has active bookings. Cancel them first.");
    }

    dbWrite(
      KEYS.courts,
      dbRead(KEYS.courts).filter((c) => c.id !== id)
    );

    return { deleted: true };
  },

  /* ----- Bookings ----- */

  getBookings(filters = {}) {
    return dbRead(KEYS.bookings)
      .filter(
        (b) =>
          !filters.email ||
          b.email.toLowerCase() === filters.email.toLowerCase()
      )
      .filter((b) => !filters.venueId || b.venueId === filters.venueId)
      .filter((b) => !filters.courtId || b.courtId === filters.courtId)
      .filter((b) => !filters.date || b.date === filters.date)
      .filter((b) => !filters.status || b.status === filters.status)
      .sort((a, b) =>
        (b.date + b.slot).localeCompare(a.date + a.slot)
      );
  },

  getBookingById: (id) =>
    dbRead(KEYS.bookings).find((b) => b.id === id) || null,

  createBooking(data) {
    const venue = LocalDemo.getVenueById(data.venueId);

    const court = dbRead(KEYS.courts).find(
      (c) => c.id === data.courtId
    );

    if (!venue || !court) {
      throw new Error("Venue or court not found.");
    }

    if (!venue.available || !court.available) {
      throw new Error(
        "This court is not available for booking right now."
      );
    }

    const bookings = dbRead(KEYS.bookings);

    if (hasConflict(bookings, data)) {
      throw new Error(
        "Sorry, that slot was just booked. Please pick another one."
      );
    }

    const customers = dbRead(KEYS.customers);

    let cust = customers.find(
      (c) => c.email.toLowerCase() === data.email.toLowerCase()
    );

    if (!cust) {
      cust = {
        id: `CUST-${1001 + customers.length}`,
        name: data.customerName,
        email: data.email,
        phone: data.phone,
      };

      customers.push(cust);
    } else {
      cust.name = data.customerName;
      cust.phone = data.phone;
    }

    dbWrite(KEYS.customers, customers);

    let id = generateBookingId();

    while (bookings.some((b) => b.id === id)) {
      id = generateBookingId();
    }

    const booking = {
      id,
      venueId: venue.id,
      venueName: data.venueName || venue.name,
      sport: data.sport || venue.sport,
      courtId: court.id,
      courtName: data.courtName || court.name,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      date: data.date,
      slot: data.slot,
      amount: Number(data.amount ?? venue.pricePerHour),
      status: "Confirmed",
      createdAt: new Date().toISOString(),
    };

    bookings.push(booking);

    dbWrite(KEYS.bookings, bookings);

    return booking;
  },

  updateBooking(id, changes) {
    const bookings = dbRead(KEYS.bookings);

    const i = bookings.findIndex((b) => b.id === id);

    if (i < 0) throw new Error("Booking not found.");

    const updated = { ...bookings[i], ...changes };

    if (
      ACTIVE_STATUSES.includes(updated.status) &&
      hasConflict(bookings, updated, id)
    ) {
      throw new Error(
        "Another active booking already uses this court and slot."
      );
    }

    bookings[i] = updated;

    dbWrite(KEYS.bookings, bookings);

    return updated;
  },

  /* ----- Customers ----- */

  getCustomers() {
    const bookings = dbRead(KEYS.bookings);

    return dbRead(KEYS.customers).map((c) => ({
      ...c,
      totalBookings: bookings.filter(
        (b) => b.email.toLowerCase() === c.email.toLowerCase()
      ).length,
    }));
  },

  resetDemoData() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));

    seedDemoData();

    return { reset: true };
  },
};

/* ==========================================================================
   5. HTTP HELPER
   ========================================================================== */

async function apiRequest(method, path, body) {
  if (!API_CONFIG.BASE_URL) {
    throw new Error(
      "API_CONFIG.BASE_URL is empty. Add your API Gateway URL in js/api.js."
    );
  }

  let response;

  try {
    response = await fetch(
      API_CONFIG.BASE_URL.replace(/\/$/, "") + path,
      {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }
    );
  } catch (error) {
    throw new Error(
      "Could not reach the PlaySlot API. Check the API Gateway URL, CORS settings, and internet connection."
    );
  }

  const text = await response.text();

  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `API request failed (${response.status})`
    );
  }

  if (data && typeof data.body === "string") {
    try {
      return JSON.parse(data.body);
    } catch {
      // Keep original response
    }
  }

  return data;
}

function queryString(filters = {}) {
  const q = new URLSearchParams(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  ).toString();

  return q ? "?" + q : "";
}

/* ==========================================================================
   6. PUBLIC API
   ========================================================================== */

const useLocal = () => API_CONFIG.USE_LOCAL_DEMO;

const local = (fn) =>
  new Promise((resolve, reject) => {
    try {
      resolve(fn());
    } catch (e) {
      reject(e);
    }
  });

/* ----- Bookings ----- */

// Bookings can independently use localStorage or AWS.

const useLocalBookings = () => !API_CONFIG.USE_AWS_BOOKINGS;

function unwrapBookingList(result) {
  if (Array.isArray(result)) return result;

  if (Array.isArray(result.bookings)) {
    return result.bookings;
  }

  if (Array.isArray(result.items)) {
    return result.items;
  }

  return [];
}

async function createBooking(data) {
  if (useLocalBookings()) {
    return local(() => LocalDemo.createBooking(data));
  }

  const result = await apiRequest("POST", "/bookings", data);

  return result.booking || result;
}

async function getBookings(filters = {}) {
  if (useLocalBookings()) {
    return local(() => LocalDemo.getBookings(filters));
  }

  const result = await apiRequest(
    "GET",
    "/bookings" + queryString(filters)
  );

  return unwrapBookingList(result);
}

async function getBookingById(id) {
  if (useLocalBookings()) {
    return local(() => LocalDemo.getBookingById(id));
  }

  const result = await apiRequest(
    "GET",
    `/bookings/${encodeURIComponent(id)}`
  );

  return result.booking || result;
}

async function updateBooking(id, changes) {
  if (useLocalBookings()) {
    return local(() => LocalDemo.updateBooking(id, changes));
  }

  const result = await apiRequest(
    "PUT",
    `/bookings/${encodeURIComponent(id)}`,
    changes
  );

  return result.booking || result;
}

async function cancelBooking(id) {
  if (useLocalBookings()) {
    return local(() =>
      LocalDemo.updateBooking(id, { status: "Cancelled" })
    );
  }

  const result = await apiRequest(
    "POST",
    `/bookings/${encodeURIComponent(id)}/cancel`
  );

  return result.booking || result;
}

/* ----- Venues ----- */

function getVenues() {
  return useLocal()
    ? local(() => LocalDemo.getVenues())
    : apiRequest("GET", "/venues");
}

function getVenueById(id) {
  return useLocal()
    ? local(() => LocalDemo.getVenueById(id))
    : apiRequest("GET", `/venues/${id}`);
}

function createVenue(data) {
  return useLocal()
    ? local(() => LocalDemo.createVenue(data))
    : apiRequest("POST", "/venues", data);
}

function updateVenue(id, data) {
  return useLocal()
    ? local(() => LocalDemo.updateVenue(id, data))
    : apiRequest("PUT", `/venues/${id}`, data);
}

function deleteVenue(id) {
  return useLocal()
    ? local(() => LocalDemo.deleteVenue(id))
    : apiRequest("DELETE", `/venues/${id}`);
}

/* ----- Courts ----- */

function getCourts(venueId) {
  return useLocal()
    ? local(() => LocalDemo.getCourts(venueId))
    : apiRequest(
        "GET",
        "/courts" + queryString({ venueId })
      );
}

function createCourt(data) {
  return useLocal()
    ? local(() => LocalDemo.createCourt(data))
    : apiRequest("POST", "/courts", data);
}

function updateCourt(id, data) {
  return useLocal()
    ? local(() => LocalDemo.updateCourt(id, data))
    : apiRequest("PUT", `/courts/${id}`, data);
}

function deleteCourt(id) {
  return useLocal()
    ? local(() => LocalDemo.deleteCourt(id))
    : apiRequest("DELETE", `/courts/${id}`);
}

/* ----- Customers & demo tools ----- */

function getCustomers() {
  return useLocal()
    ? local(() => LocalDemo.getCustomers())
    : apiRequest("GET", "/customers");
}

function resetDemoData() {
  return useLocal()
    ? local(() => LocalDemo.resetDemoData())
    : Promise.reject(
        new Error("Reset is only available in demo mode.")
      );
}

/* ----- Initialize demo data ----- */

if (API_CONFIG.USE_LOCAL_DEMO) {
  seedDemoData();
}