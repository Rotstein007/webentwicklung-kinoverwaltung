import { apiGet, apiPost } from './api.js';
import { createResponsivePaginator } from './pagination.js';

function openHallModal (hall) {
  const existing = document.getElementById('hall-modal-wrapper');
  if (existing) {
    existing.remove();
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'hall-modal-wrapper';
  wrapper.innerHTML = `
    <div class="hall-modal-backdrop" data-action="close">
      <div class="hall-modal" role="dialog" aria-modal="true" aria-label="Kinosaal">
        <header class="hall-modal-header">
          <div class="hall-modal-title">${hall.name}</div>
          <button type="button" class="hall-modal-close" data-action="close" aria-label="Schließen">
            <span class="icon" aria-hidden="true">close</span>
          </button>
        </header>
        <div class="hall-modal-body">
          <p><strong>Name:</strong> ${hall.name}</p>
          <p><strong>Sitzreihen:</strong> ${hall.rows}</p>
          <p><strong>Sitze pro Reihe:</strong> ${hall.seatsPerRow}</p>
        </div>
      </div>
    </div>
  `;

  wrapper.addEventListener('click', (event) => {
    const closeEl = event.target.closest('[data-action="close"]');
    const backdropEl = wrapper.querySelector('.hall-modal-backdrop');
    const clickedBackdrop = backdropEl && event.target === backdropEl;

    if (closeEl && (clickedBackdrop || closeEl.classList.contains('hall-modal-close'))) {
      wrapper.remove();
    }
  });

  document.body.appendChild(wrapper);
}

export async function renderOperatorHallsView (app, navigateTo, state) {
  state.role = 'operator';

  app.innerHTML = `
    <section class="hall-section">
      <div class="hall-section-header">
        <div class="hall-section-title">
          <h2>Kinosaalverwaltung</h2>
          <span class="role-badge role-badge--operator">Betreiber</span>
        </div>
        <button type="button" id="back-home">Zurück</button>
      </div>
      <p class="hall-message">Kinosäle können nur angelegt (nicht bearbeitet/gelöscht) werden.</p>

      <form id="hall-form" class="hall-form" autocomplete="off">
        <div class="hall-form-row">
          <label for="hall-name">Name</label>
          <input id="hall-name" name="name" type="text" placeholder="z.B. Saal 1" />
        </div>
        <div class="hall-form-row">
          <label for="hall-rows">Reihen</label>
          <input id="hall-rows" name="rows" type="number" min="1" value="10" />
        </div>
        <div class="hall-form-row">
          <label for="hall-seats">Sitze pro Reihe</label>
          <input id="hall-seats" name="seatsPerRow" type="number" min="1" value="20" />
        </div>
        <button type="submit" class="hall-form-submit" id="add-hall">Kinosaal anlegen</button>
      </form>

      <div id="halls-message" class="message"></div>
      <div id="halls-grid" class="hall-grid" aria-label="Kinosäle"></div>
      <div class="pagination" id="halls-pagination">
        <button type="button" data-pagination="prev">Zurück</button>
        <span data-pagination="label"></span>
        <button type="button" data-pagination="next">Weiter</button>
      </div>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('operatorHome'));
  }

  const formEl = document.getElementById('hall-form');
  const messageEl = document.getElementById('halls-message');
  const nameInput = document.getElementById('hall-name');
  const rowsInput = document.getElementById('hall-rows');
  const seatsInput = document.getElementById('hall-seats');
  const gridEl = document.getElementById('halls-grid');
  const controlsEl = document.getElementById('halls-pagination');

  if (!formEl || !messageEl || !nameInput || !rowsInput || !seatsInput || !gridEl || !controlsEl) {
    return null;
  }

  let halls = [];

  const paginator = createResponsivePaginator({
    listEl: gridEl,
    controlsEl,
    estimateItemHeightPx: 130,
    bottomReservePx: 220,
    getItems: () => halls,
    renderItem: (hall) => `
      <button type="button"
        class="hall-card"
        data-hall-id="${hall._id}"
        data-name="${hall.name}"
        data-rows="${hall.rows}"
        data-seats-per-row="${hall.seatsPerRow}">
        <div class="hall-card-header">
          <span class="hall-name">${hall.name}</span>
        </div>
        <div class="hall-meta">${hall.rows} Reihen · ${hall.seatsPerRow} Sitze/ Reihe</div>
      </button>
    `
  });

  gridEl.addEventListener('click', (event) => {
    const card = event.target.closest('button[data-hall-id]');
    if (!card) {
      return;
    }

    openHallModal({
      _id: card.dataset.hallId,
      name: card.dataset.name,
      rows: Number.parseInt(card.dataset.rows, 10),
      seatsPerRow: Number.parseInt(card.dataset.seatsPerRow, 10)
    });
  });

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const name = nameInput.value.trim();
      const rows = Number.parseInt(rowsInput.value, 10);
      const seatsPerRow = Number.parseInt(seatsInput.value, 10);

      if (!name) {
        messageEl.textContent = 'Bitte einen Namen angeben.';
        return;
      }

      if (!Number.isFinite(rows) || rows <= 0 || !Number.isFinite(seatsPerRow) || seatsPerRow <= 0) {
        messageEl.textContent = 'Bitte gültige Werte für Reihen und Sitze pro Reihe angeben.';
        return;
      }

      messageEl.textContent = 'Lege neuen Saal an...';

      await apiPost('/halls', {
        name,
        rows,
        seatsPerRow
      });

      halls = await apiGet('/halls');
      paginator.render();
      messageEl.textContent = '';
      nameInput.value = '';
    } catch (err) {
      console.error(err);
      if (err.status === 409) {
        messageEl.textContent = 'Es existiert bereits ein Saal mit diesem Namen.';
      } else {
        messageEl.textContent = 'Fehler beim Anlegen des Saals.';
      }
    }
  });

  try {
    messageEl.textContent = 'Lade Kinosäle...';
    halls = await apiGet('/halls');
    messageEl.textContent = halls.length === 0 ? 'Noch keine Kinosäle vorhanden.' : '';
    paginator.render();
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden der Kinosäle.';
  }

  return () => {
    paginator.destroy();
  };
}
