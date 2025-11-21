// server/src/server.js
// Minimaler Express-Server

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Port aus Kommandozeilenargument oder Standard 8080
const portArg = process.argv[2];
const port = portArg ? Number(portArg) : 8080;

if (Number.isNaN(port)) {
  console.error('Ungültiger Port:', portArg);
  process.exit(1);
}

// Pfad zum gebauten Client (client/dist)
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');

// Statische Dateien ausliefern
app.use(express.static(clientDistPath));

// Kleine Health-Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
