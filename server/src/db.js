// Datenbankzugriff (MongoDB)

import { MongoClient } from 'mongodb';

// Standardkonfiguration
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'kinoverwaltung';

let client;
let db;

// Stellt die Verbindung zur Datenbank her (einmalig pro Prozess)
export async function connectToDatabase () {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGO_URL);

  await client.connect();
  db = client.db(DB_NAME);

  // Basis-Indizes (optional, aber hilfreich)
  try {
    await Promise.all([
      db.collection('halls').createIndex({ name: 1 }, { unique: true }),
      db.collection('shows').createIndex({ startsAt: 1 }),
      db.collection('reservations').createIndex({ showId: 1 }),
      db.collection('reservations').createIndex({ showId: 1, seatCodes: 1 })
    ]);
  } catch (err) {
    console.warn('Indizes konnten nicht angelegt werden:', err);
  }

  console.log(`MongoDB verbunden (${MONGO_URL}, DB: ${DB_NAME})`);

  return db;
}

// Gibt das initialisierte Datenbankobjekt zurück
export function getDb () {
  if (!db) {
    throw new Error('Datenbankverbindung ist noch nicht initialisiert.');
  }

  return db;
}
