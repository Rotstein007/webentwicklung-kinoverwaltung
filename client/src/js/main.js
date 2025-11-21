// client/src/js/main.js
import { renderTicketView } from './ticket.js';

// Globaler State (kann später aus Backend, Form, etc. kommen)
const state = {
  currentPage: 'home',
  ticket: {
    vorname: 'Max',
    nachname: 'Mustermann',
    film: 'Inception',
    sitzplatz: 'Reihe 5, Platz 8'
  }
};

function navigateTo (page) {
  state.currentPage = page;
  render();
}

function renderHomeView (app) {
  app.innerHTML = `
    <section>
      <h2>Willkommen zur Kinoverwaltung</h2>
      <p>Hier kommt später die Rollenwahl (Betreiber / Kunde).</p>
      <button id="go-ticket">Ticket ansehen</button>
    </section>
  `;

  const ticketButton = document.getElementById('go-ticket');
  if (ticketButton) {
    ticketButton.addEventListener('click', () => navigateTo('ticket'));
  }
}

function renderFallbackView (app) {
  app.innerHTML = `
        <section>
          <h2>Seite nicht gefunden</h2>
          <button id="back-home">Zurück zur Startseite</button>
        </section>
      `;
  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}

function render () {
  updateTitle(state);

  const app = document.getElementById('app');
  if (!app) {
    console.error('Element mit ID "app" wurde nicht gefunden.');
    return;
  }

  switch (state.currentPage) {
    case 'home':
      renderHomeView(app);
      break;

    case 'ticket':
      renderTicketView(app, state, navigateTo);
      break;

    default:
      renderFallbackView(app);
      break;
  }
}

function updateTitle (state) {
  let title = 'Kinoverwaltung';

  switch (state.currentPage) {
    case 'home':
      title = 'Startseite';
      break;

    case 'ticket':
      title = 'Ticket';
      break;

    default:
      title = 'Seite nicht gefunden';
      break;
  }

  document.title = title;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Client-App gestartet');
  render();
});
