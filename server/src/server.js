// HTTP-Server für Client und REST-API

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from './db.js';
import { seedDemoDataIfEmpty } from './seedDemo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware für JSON-Body
app.use(express.json());

// Port-Konfiguration (Kommandozeilenargument oder Standard 8080)
const portArg = process.argv[2];
const port = Number.parseInt(portArg, 10) || 8080;

// Hilfsfunktion für Zugriff auf Collection
function getHallsCollection () {
  const db = getDb();
  return db.collection('halls');
}

function getShowsCollection () {
  const db = getDb();
  return db.collection('shows');
}

function getReservationsCollection () {
  const db = getDb();
  return db.collection('reservations');
}

function isNonEmptyString (value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseObjectId (id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function parseSeatCodes (seatCodes) {
  if (!Array.isArray(seatCodes)) {
    return null;
  }

  const normalized = seatCodes
    .filter(code => typeof code === 'string')
    .map(code => code.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return null;
  }

  const invalid = normalized.find(code => !/^\d+:\d+$/.test(code));
  if (invalid) {
    return null;
  }

  return [...new Set(normalized)];
}

// REST-API: Kinosäle

// Gibt alle Kinosäle zurück
app.get('/api/halls', async (req, res) => {
  try {
    const collection = getHallsCollection();
    const halls = await collection.find({}).sort({ name: 1 }).toArray();
    res.json(halls);
  } catch (err) {
    console.error('Fehler beim Laden der Kinosäle:', err);
    res.status(500).json({ error: 'Interner Serverfehler beim Laden der Kinosäle.' });
  }
});

// Legt einen neuen Kinosaal an
app.post('/api/halls', async (req, res) => {
  const { name, rows, seatsPerRow } = req.body;

  const trimmedName = typeof name === 'string' ? name.trim() : '';

  if (!trimmedName || !Number.isInteger(rows) || rows <= 0 || !Number.isInteger(seatsPerRow) || seatsPerRow <= 0) {
    return res.status(400).json({ error: 'Ungültige Daten für Kinosaal.' });
  }

  try {
    const collection = getHallsCollection();

    // Duplikate vermeiden: Name muss eindeutig sein
    const existing = await collection.findOne({ name: trimmedName });
    if (existing) {
      return res.status(409).json({ error: 'Ein Kinosaal mit diesem Namen existiert bereits.' });
    }

    const insertResult = await collection.insertOne({
      name: trimmedName,
      rows,
      seatsPerRow
    });

    const createdHall = await collection.findOne({ _id: insertResult.insertedId });
    res.status(201).json(createdHall);
  } catch (err) {
    console.error('Fehler beim Anlegen eines Kinosaals:', err);
    res.status(500).json({ error: 'Interner Serverfehler beim Anlegen des Kinosaals.' });
  }
});

// REST-API: Vorstellungen

// Gibt alle Vorstellungen zurück (inkl. zugehörigem Kinosaal)
app.get('/api/shows', async (req, res) => {
  try {
    const showsCollection = getShowsCollection();
    const hallsCollection = getHallsCollection();

    const shows = await showsCollection.find({}).sort({ startsAt: 1 }).toArray();
    const hallIds = [...new Set(shows.map(show => String(show.hallId)))].map(id => parseObjectId(id)).filter(Boolean);

    const halls = await hallsCollection.find({ _id: { $in: hallIds } }).toArray();
    const hallsById = new Map(halls.map(hall => [String(hall._id), hall]));

    const response = shows.map(show => ({
      ...show,
      hall: hallsById.get(String(show.hallId)) || null
    }));

    return res.json(response);
  } catch (err) {
    console.error('Fehler beim Laden der Vorstellungen:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Laden der Vorstellungen.' });
  }
});

// Gibt eine Vorstellung anhand der ID zurück (inkl. Kinosaal)
app.get('/api/shows/:id', async (req, res) => {
  const objectId = parseObjectId(req.params.id);
  if (!objectId) {
    return res.status(400).json({ error: 'Ungültige ID für Vorstellung.' });
  }

  try {
    const showsCollection = getShowsCollection();
    const hallsCollection = getHallsCollection();

    const show = await showsCollection.findOne({ _id: objectId });
    if (!show) {
      return res.status(404).json({ error: 'Vorstellung nicht gefunden.' });
    }

    const hall = await hallsCollection.findOne({ _id: show.hallId });

    return res.json({
      ...show,
      hall: hall || null
    });
  } catch (err) {
    console.error('Fehler beim Laden der Vorstellung:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Laden der Vorstellung.' });
  }
});

// Legt eine neue Vorstellung an
app.post('/api/shows', async (req, res) => {
  const { startsAt, hallId, movieTitle } = req.body;

  if (!isNonEmptyString(movieTitle)) {
    return res.status(400).json({ error: 'Ungültiger Filmname.' });
  }

  const startsAtDate = new Date(startsAt);
  if (!(startsAtDate instanceof Date) || Number.isNaN(startsAtDate.getTime())) {
    return res.status(400).json({ error: 'Ungültiges Datum/Uhrzeit.' });
  }

  const hallObjectId = parseObjectId(hallId);
  if (!hallObjectId) {
    return res.status(400).json({ error: 'Ungültige Kinosaal-ID.' });
  }

  try {
    const hallsCollection = getHallsCollection();
    const showsCollection = getShowsCollection();

    const hall = await hallsCollection.findOne({ _id: hallObjectId });
    if (!hall) {
      return res.status(404).json({ error: 'Kinosaal nicht gefunden.' });
    }

    const insertResult = await showsCollection.insertOne({
      startsAt: startsAtDate,
      hallId: hallObjectId,
      movieTitle: movieTitle.trim()
    });

    const createdShow = await showsCollection.findOne({ _id: insertResult.insertedId });
    return res.status(201).json({
      ...createdShow,
      hall
    });
  } catch (err) {
    console.error('Fehler beim Anlegen einer Vorstellung:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Anlegen der Vorstellung.' });
  }
});

// Gibt alle reservierten Sitzplätze für eine Vorstellung zurück
app.get('/api/shows/:id/occupied-seats', async (req, res) => {
  const showObjectId = parseObjectId(req.params.id);
  if (!showObjectId) {
    return res.status(400).json({ error: 'Ungültige ID für Vorstellung.' });
  }

  try {
    const reservationsCollection = getReservationsCollection();

    const reservations = await reservationsCollection
      .find({ showId: showObjectId }, { projection: { seatCodes: 1 } })
      .toArray();

    const seatCodes = [...new Set(reservations.flatMap(r => r.seatCodes || []))].sort((a, b) => a.localeCompare(b));

    return res.json({ seatCodes });
  } catch (err) {
    console.error('Fehler beim Laden belegter Sitzplätze:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Laden belegter Sitzplätze.' });
  }
});

// REST-API: Reservierungen

// Legt eine neue Reservierung an
app.post('/api/reservations', async (req, res) => {
  const { showId, seatCodes, customerName } = req.body;

  const showObjectId = parseObjectId(showId);
  if (!showObjectId) {
    return res.status(400).json({ error: 'Ungültige Vorstellung-ID.' });
  }

  const normalizedSeatCodes = parseSeatCodes(seatCodes);
  if (!normalizedSeatCodes) {
    return res.status(400).json({ error: 'Ungültige Sitzplätze.' });
  }

  if (!isNonEmptyString(customerName)) {
    return res.status(400).json({ error: 'Ungültiger Kundenname.' });
  }

  try {
    const showsCollection = getShowsCollection();
    const hallsCollection = getHallsCollection();
    const reservationsCollection = getReservationsCollection();

    const show = await showsCollection.findOne({ _id: showObjectId });
    if (!show) {
      return res.status(404).json({ error: 'Vorstellung nicht gefunden.' });
    }

    const hall = await hallsCollection.findOne({ _id: show.hallId });
    if (!hall) {
      return res.status(500).json({ error: 'Kinosaal zur Vorstellung nicht gefunden.' });
    }

    const outOfRange = normalizedSeatCodes.find(code => {
      const [rowStr, seatStr] = code.split(':');
      const row = Number.parseInt(rowStr, 10);
      const seat = Number.parseInt(seatStr, 10);
      return row < 1 || row > hall.rows || seat < 1 || seat > hall.seatsPerRow;
    });
    if (outOfRange) {
      return res.status(400).json({ error: 'Mindestens ein Sitzplatz liegt außerhalb des Kinosaals.' });
    }

    const conflict = await reservationsCollection.findOne({
      showId: showObjectId,
      seatCodes: { $in: normalizedSeatCodes }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Mindestens ein Sitzplatz ist bereits reserviert.' });
    }

    const insertResult = await reservationsCollection.insertOne({
      showId: showObjectId,
      customerName: customerName.trim(),
      seatCodes: normalizedSeatCodes,
      createdAt: new Date()
    });

    return res.status(201).json({ _id: insertResult.insertedId });
  } catch (err) {
    console.error('Fehler beim Anlegen einer Reservierung:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Anlegen der Reservierung.' });
  }
});

// Gibt eine Reservierung zurück (inkl. Vorstellung + Kinosaal)
app.get('/api/reservations/:id', async (req, res) => {
  const reservationObjectId = parseObjectId(req.params.id);
  if (!reservationObjectId) {
    return res.status(400).json({ error: 'Ungültige ID für Reservierung.' });
  }

  try {
    const reservationsCollection = getReservationsCollection();
    const showsCollection = getShowsCollection();
    const hallsCollection = getHallsCollection();

    const reservation = await reservationsCollection.findOne({ _id: reservationObjectId });
    if (!reservation) {
      return res.status(404).json({ error: 'Reservierung nicht gefunden.' });
    }

    const show = await showsCollection.findOne({ _id: reservation.showId });
    const hall = show ? await hallsCollection.findOne({ _id: show.hallId }) : null;

    return res.json({
      ...reservation,
      show: show || null,
      hall: hall || null
    });
  } catch (err) {
    console.error('Fehler beim Laden der Reservierung:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Laden der Reservierung.' });
  }
});

// Statische Dateien (Client-Build)
const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(distPath));

// Fallback: Single-Page-Application (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialisierung von Datenbank und HTTP-Server
async function startServer () {
  try {
    console.log('Versuche, eine Verbindung zur MongoDB herzustellen ...');
    const db = await connectToDatabase();
    await seedDemoDataIfEmpty(db);
    app.listen(port, () => {
      console.log(`Server läuft auf http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Datenbankverbindung fehlgeschlagen:', err);
    process.exit(1);
  }
}

startServer();
