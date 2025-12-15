import { apiGet } from './api.js';
import { createResponsivePaginator } from './pagination.js';

function formatDateTime (value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function renderCustomerHomeView (app, navigateTo, state) {
  state.role = 'customer';

  app.innerHTML = `
    <section>
      <h2>Kunde</h2>
      <p>Wähle eine Vorstellung und reserviere freie Sitzplätze.</p>

      <div class="toolbar">
        <button type="button" id="switch-role">Rolle wechseln</button>
      </div>

      <div id="shows-message" class="message"></div>

      <div id="shows-list" class="resource-list" aria-label="Vorstellungen"></div>

      <div class="pagination" id="shows-pagination">
        <button type="button" data-pagination="prev">Zurück</button>
        <span data-pagination="label"></span>
        <button type="button" data-pagination="next">Weiter</button>
      </div>
    </section>
  `;

  const listEl = document.getElementById('shows-list');
  const messageEl = document.getElementById('shows-message');
  const controlsEl = document.getElementById('shows-pagination');

  const switchRoleBtn = document.getElementById('switch-role');
  if (switchRoleBtn) {
    switchRoleBtn.addEventListener('click', () => {
      state.role = null;
      navigateTo('home');
    });
  }

  if (!listEl || !controlsEl || !messageEl) {
    return null;
  }

  let shows = [];

  const paginator = createResponsivePaginator({
    listEl,
    controlsEl,
    getItems: () => shows,
    renderItem: (show) => {
      const hallName = show?.hall?.name ? ` – ${show.hall.name}` : '';
      return `
        <div class="resource-item" data-show-id="${show._id}">
          <div class="resource-main">
            <div class="resource-title">${show.movieTitle || 'Unbekannter Film'}${hallName}</div>
            <div class="resource-meta">${formatDateTime(show.startsAt)}</div>
          </div>
          <div class="resource-actions">
            <button type="button" data-action="reserve" data-show-id="${show._id}">Reservieren</button>
          </div>
        </div>
      `;
    }
  });

  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="reserve"]');
    const showId = button?.dataset?.showId;
    if (showId) {
      navigateTo('customerReservation', { showId });
    }
  });

  try {
    messageEl.textContent = 'Lade Vorstellungen...';
    shows = await apiGet('/shows');
    messageEl.textContent = shows.length === 0 ? 'Noch keine Vorstellungen vorhanden.' : '';
    paginator.render();
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden der Vorstellungen.';
  }

  return () => {
    paginator.destroy();
  };
}
