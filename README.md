# 🎬 Webentwicklung – Kinoverwaltung

Single-Page-Webanwendung für die Verwaltung eines Kinos (Betreiber- und Kundenseite) mit einem eigenen Node.js/Express-Server und Build-Prozess via `npm`.

> **Hinweis:** Aktuell werden nur **Linux** und **macOS** unterstützt.  
> Unter Windows funktioniert das Projekt so nur mit WSL oder ähnlichen Umgebungen.

---

## Tech-Stack

- **Node.js** + **Express** (HTTP-Server, REST-API)
- **Vanilla JavaScript** (ES Modules, kein Framework)
- **Less** → CSS
- **esbuild** (Bundling, optional Minify)
- **semistandard** (Linting)
- **nodemon** (Auto-Restart in der Entwicklung)

---

## Voraussetzungen

- **Node.js** (empfohlen: Version 18 oder höher)
- **npm** (wird normalerweise mit Node installiert)
- Ein Terminal unter **Linux** oder **macOS**

---

## Projekt herunterladen

### Variante 1: Git Clone (empfohlen)

git clone git@github.com:Rotstein007/webentwicklung-kinoverwaltung.git
cd webentwicklung-kinoverwaltung

### Variante 2: ZIP-Download

1. ZIP von GitHub  herunterladen
2. ZIP entpacken
3. Im Terminal in den entpackten Ordner wechseln

---

## 📦 Installation

npm install

---

## Befehle

### Server normal starten
npm run start

Erreichbar unter: http://localhost:8080

### Debug-Build (ohne Minify)
npm run debug

### Produktionsbuild (minified)
npm run build

### Build-Artefakte löschen
npm run clean