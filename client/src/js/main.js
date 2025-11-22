// client/src/js/main.js
import { renderTicketView } from './ticketView.js';
import { renderHomeView } from './homeView.js';
import { renderCustomerHomeView } from './customerHomeView.js';
import { renderCustomerReservationView } from './customerReservationView.js';
import { renderOperatorHomeView } from './operatorHomeView.js';
import { renderOperatorHallsView } from './operatorHallsView.js';
import { renderOperatorShowsView } from './operatorShowsView.js';
import { renderNotFoundView } from './notFoundView.js';

// Test Variablen für QR code generator
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

function render () {
  updateTitle(state);

  const app = document.getElementById('app');
  if (!app) {
    console.error('Element mit ID "app" wurde nicht gefunden.');
    return;
  }

  switch (state.currentPage) {
    case 'home':
      renderHomeView(app, navigateTo);
      break;

    case 'customerHome':
      renderCustomerHomeView(app, navigateTo);
      break;

    case 'customerReservation':
      renderCustomerReservationView(app, navigateTo);
      break;

    case 'operatorHome':
      renderOperatorHomeView(app, navigateTo);
      break;

    case 'operatorHalls':
      renderOperatorHallsView(app, navigateTo);
      break;

    case 'operatorShows':
      renderOperatorShowsView(app, navigateTo);
      break;

    case 'ticket':
      renderTicketView(app, state, navigateTo);
      break;

    default:
      renderNotFoundView(app, navigateTo);
      break;
  }
}

function updateTitle (state) {
  let title = 'Kinoverwaltung';

  switch (state.currentPage) {
    case 'home':
      title = 'Auswahl';
      break;

    case 'customerHome':
      title = 'Startseite';
      break;

    case 'customerReservation':
      title = 'Reservierungen';
      break;

    case 'operatorHome':
      title = 'Startseite';
      break;

    case 'operatorHalls':
      title = 'Kinosaal verwaltung';
      break;

    case 'operatorShows':
      title = 'Vorstellungen';
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
