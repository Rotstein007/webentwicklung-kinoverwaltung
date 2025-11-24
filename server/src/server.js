// HTTP-Server für Client und REST-API

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase, getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// Port-Konfiguration (Kommandozeilenargument oder Standard 8080)
const portArg = process.argv[2];
const port = portArg ? Number(portArg) : 8080;

if (Number.isNaN(port)) {
  console.error('Ungültiger Port:', portArg);
  process.exit(1);
}

// Statische Auslieferung des gebauten Clients
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Health-Check für den Server
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health-Check für die Datenbank
app.get('/api/health/db', (req, res) => {
  try {
    getDb();
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

// Alle Kinosäle ausgeben
app.get('/api/halls', async (req, res) => {
  try {
    const db = getDb();
    const halls = await db
      .collection('halls')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    res.json(halls);
  } catch (err) {
    console.error('Fehler beim Lesen der Kinosäle:', err);
    res.status(500).json({ error: 'Fehler beim Lesen der Kinosäle' });
  }
});

// Neuen Kinosaal anlegen
app.post('/api/halls', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('halls');

    const body = req.body || {};

    // Anzahl vorhandener Säle, um einen Standardnamen zu vergeben
    const count = await collection.countDocuments();
    const defaultName = `Saal ${count + 1}`;

    const hall = {
      name: body.name || defaultName,
      rows: body.rows || 10,
      seatsPerRow: body.seatsPerRow || 20,
      createdAt: new Date()
    };

    const result = await collection.insertOne(hall);
    hall._id = result.insertedId;

    res.status(201).json(hall);
  } catch (err) {
    console.error('Fehler beim Anlegen eines Kinosaals:', err);
    res.status(500).json({ error: 'Fehler beim Anlegen eines Kinosaals' });
  }
});

// Initialisierung von Datenbank und HTTP-Server
async function startServer () {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server läuft auf http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Datenbankverbindung fehlgeschlagen:', err);
    process.exit(1);
  }
}

startServer();
