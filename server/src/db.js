// Datenbankzugriff (MongoDB)

import { MongoClient } from 'mongodb';

// Standardkonfiguration (kann über Umgebungsvariablen überschrieben werden)
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
