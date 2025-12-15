// client/src/js/main.js
import { renderTicketView } from './ticketView.js';
import { renderHomeView } from './homeView.js';
import { renderCustomerHomeView } from './customerHomeView.js';
import { renderCustomerReservationView } from './customerReservationView.js';
import { renderOperatorHomeView } from './operatorHomeView.js';
import { renderOperatorHallsView } from './operatorHallsView.js';
import { renderOperatorShowsView } from './operatorShowsView.js';
import { renderNotFoundView } from './notFoundView.js';

const state = {
  currentPage: 'home',
  role: null,
  params: {},
  cleanup: null
};

function setRole (role) {
  state.role = role;
  if (role === 'operator') {
    navigateTo('operatorHome');
    return;
  }
  if (role === 'customer') {
    navigateTo('customerHome');
    return;
  }
  navigateTo('home');
}

function navigateTo (page, params = {}) {
  state.currentPage = page;
  state.params = params || {};
  render().catch(err => {
    console.error('Render-Fehler:', err);
  });
}

function isAllowedForRole (page) {
  if (page === 'home' || page === 'doesNotExist') {
    return true;
  }

  if (state.role === 'operator') {
    return ['operatorHome', 'operatorHalls', 'operatorShows'].includes(page);
  }

  if (state.role === 'customer') {
    return ['customerHome', 'customerReservation', 'ticket'].includes(page);
  }

  return false;
}

async function render () {
  if (state.cleanup) {
    try {
      state.cleanup();
    } catch (err) {
      console.error('Fehler beim Cleanup:', err);
    }
    state.cleanup = null;
  }

  if (!isAllowedForRole(state.currentPage)) {
    state.currentPage = 'home';
    state.params = {};
  }

  updateTitle(state);

  const app = document.getElementById('app');
  if (!app) {
    console.error('Element mit ID "app" wurde nicht gefunden.');
    return;
  }

  switch (state.currentPage) {
    case 'home':
      state.cleanup = renderHomeView(app, navigateTo, state, setRole) || null;
      break;

    case 'customerHome':
      state.cleanup = (await renderCustomerHomeView(app, navigateTo, state)) || null;
      break;

    case 'customerReservation':
      state.cleanup = (await renderCustomerReservationView(app, navigateTo, state)) || null;
      break;

    case 'operatorHome':
      state.cleanup = renderOperatorHomeView(app, navigateTo, state, setRole) || null;
      break;

    case 'operatorHalls':
      state.cleanup = (await renderOperatorHallsView(app, navigateTo, state)) || null;
      break;

    case 'operatorShows':
      state.cleanup = (await renderOperatorShowsView(app, navigateTo, state)) || null;
      break;

    case 'ticket':
      state.cleanup = (await renderTicketView(app, state, navigateTo)) || null;
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
  render().catch(err => {
    console.error('Render-Fehler:', err);
  });
});
