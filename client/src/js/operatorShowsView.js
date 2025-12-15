import { apiGet, apiPost } from './api.js';
import { createResponsivePaginator } from './pagination.js';

function toDatetimeLocalValue (date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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

export async function renderOperatorShowsView (app, navigateTo, state) {
  state.role = 'operator';

  app.innerHTML = `
    <section>
      <div class="hall-section-header">
        <div class="hall-section-title">
          <h2>Vorstellungen</h2>
          <span class="role-badge role-badge--operator">Betreiber</span>
        </div>
        <button type="button" id="back">Zurück</button>
      </div>

      <p class="hall-message">Vorstellungen können nur angelegt (nicht bearbeitet/gelöscht) werden.</p>

      <form id="show-form" class="form" autocomplete="off">
        <div class="form-row">
          <label for="movie-title">Filmname</label>
          <input id="movie-title" name="movieTitle" type="text" placeholder="z.B. Inception" />
        </div>
        <div class="form-row">
          <label for="starts-at">Beginn</label>
          <input id="starts-at" name="startsAt" type="datetime-local" />
        </div>
        <div class="form-row">
          <label for="hall-id">Kinosaal</label>
          <select id="hall-id" name="hallId"></select>
        </div>
        <div class="form-actions">
          <button type="submit">Vorstellung anlegen</button>
        </div>
      </form>

      <div id="shows-message" class="message"></div>
      <div id="shows-list" class="resource-list" aria-label="Vorstellungen"></div>
      <div class="pagination" id="shows-pagination">
        <button type="button" data-pagination="prev">Zurück</button>
        <span data-pagination="label"></span>
        <button type="button" data-pagination="next">Weiter</button>
      </div>
    </section>
  `;

  const backBtn = document.getElementById('back');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('operatorHome'));
  }

  const formEl = document.getElementById('show-form');
  const titleInput = document.getElementById('movie-title');
  const startsAtInput = document.getElementById('starts-at');
  const hallSelect = document.getElementById('hall-id');
  const messageEl = document.getElementById('shows-message');
  const listEl = document.getElementById('shows-list');
  const controlsEl = document.getElementById('shows-pagination');

  if (!formEl || !titleInput || !startsAtInput || !hallSelect || !messageEl || !listEl || !controlsEl) {
    return null;
  }

  let halls = [];
  let shows = [];

  const paginator = createResponsivePaginator({
    listEl,
    controlsEl,
    getItems: () => shows,
    renderItem: (show) => {
      const hallName = show?.hall?.name ? ` – ${show.hall.name}` : '';
      return `
        <div class="resource-item">
          <div class="resource-main">
            <div class="resource-title">${show.movieTitle || 'Unbekannter Film'}${hallName}</div>
            <div class="resource-meta">${formatDateTime(show.startsAt)}</div>
          </div>
        </div>
      `;
    }
  });

  try {
    messageEl.textContent = 'Lade Kinosäle...';
    halls = await apiGet('/halls');

    if (halls.length === 0) {
      messageEl.textContent = 'Bitte zuerst mindestens einen Kinosaal anlegen.';
      hallSelect.innerHTML = '';
      startsAtInput.value = toDatetimeLocalValue(new Date());
      return () => paginator.destroy();
    }

    hallSelect.innerHTML = halls.map(hall => `<option value="${hall._id}">${hall.name}</option>`).join('');
    startsAtInput.value = toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));

    messageEl.textContent = 'Lade Vorstellungen...';
    shows = await apiGet('/shows');
    messageEl.textContent = shows.length === 0 ? 'Noch keine Vorstellungen vorhanden.' : '';
    paginator.render();
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden der Daten.';
  }

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();

    const movieTitle = titleInput.value.trim();
    const startsAt = startsAtInput.value;
    const hallId = hallSelect.value;

    if (!movieTitle) {
      messageEl.textContent = 'Bitte einen Filmnamen angeben.';
      return;
    }
    if (!startsAt) {
      messageEl.textContent = 'Bitte Datum/Uhrzeit angeben.';
      return;
    }
    if (!hallId) {
      messageEl.textContent = 'Bitte einen Kinosaal auswählen.';
      return;
    }

    try {
      messageEl.textContent = 'Lege Vorstellung an...';
      await apiPost('/shows', {
        movieTitle,
        startsAt: new Date(startsAt).toISOString(),
        hallId
      });

      shows = await apiGet('/shows');
      messageEl.textContent = '';
      titleInput.value = '';
      paginator.render();
    } catch (err) {
      console.error(err);
      messageEl.textContent = 'Fehler beim Anlegen der Vorstellung.';
    }
  });

  return () => {
    paginator.destroy();
  };
}
