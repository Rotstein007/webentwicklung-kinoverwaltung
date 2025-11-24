// HTTP-Server für Client und REST-API

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from './db.js';

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

// Löscht einen Kinosaal anhand der ID
app.delete('/api/halls/:id', async (req, res) => {
  const { id } = req.params;

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (err) {
    return res.status(400).json({ error: 'Ungültige ID für Kinosaal.' });
  }

  try {
    const collection = getHallsCollection();
    const deleteResult = await collection.deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Kinosaal nicht gefunden.' });
    }

    // 204: Kein Inhalt, Löschen war erfolgreich
    return res.status(204).send();
  } catch (err) {
    console.error('Fehler beim Löschen eines Kinosaals:', err);
    return res.status(500).json({ error: 'Interner Serverfehler beim Löschen des Kinosaals.' });
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
