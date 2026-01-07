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
          <label>Neuer Saal</label>
          <div class="hall-preview" id="hall-preview">Saal 1</div>
        </div>
        <div class="hall-form-row">
          <label for="hall-rows">Reihen</label>
          <div class="number-input-wrapper">
            <button type="button" class="number-btn number-btn--minus" data-target="hall-rows">−</button>
            <input id="hall-rows" name="rows" type="number" min="1" value="10" />
            <button type="button" class="number-btn number-btn--plus" data-target="hall-rows">+</button>
          </div>
        </div>
        <div class="hall-form-row">
          <label for="hall-seats">Sitze pro Reihe</label>
          <div class="number-input-wrapper">
            <button type="button" class="number-btn number-btn--minus" data-target="hall-seats">−</button>
            <input id="hall-seats" name="seatsPerRow" type="number" min="1" value="20" />
            <button type="button" class="number-btn number-btn--plus" data-target="hall-seats">+</button>
          </div>
        </div>
        <button type="submit" class="hall-form-submit" id="add-hall">Kinosaal anlegen</button>
      </form>

      <div id="halls-message" class="message"></div>
      <div id="halls-grid" class="hall-grid" aria-label="Kinosäle"></div>
      <div class="pagination-controls" id="halls-pagination">
        <div class="pagination-nav">
          <button type="button" data-pagination="prev">Zurück</button>
          <span data-pagination="label"></span>
          <button type="button" data-pagination="next">Weiter</button>
        </div>
        <div class="pagination-options">
          <label for="items-per-page">Anzeigen:</label>
          <select id="items-per-page" class="items-select">
            <option value="auto">Auto</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="12">12</option>
            <option value="16">16</option>
          </select>
        </div>
      </div>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('operatorHome'));
  }

  const formEl = document.getElementById('hall-form');
  const messageEl = document.getElementById('halls-message');
  const previewEl = document.getElementById('hall-preview');
  const rowsInput = document.getElementById('hall-rows');
  const seatsInput = document.getElementById('hall-seats');
  const gridEl = document.getElementById('halls-grid');
  const controlsEl = document.getElementById('halls-pagination');
  const itemsPerPageSelect = document.getElementById('items-per-page');

  if (!formEl || !messageEl || !previewEl || !rowsInput || !seatsInput || !gridEl || !controlsEl || !itemsPerPageSelect) {
    return null;
  }

  function getNextHallName () {
    return `Saal ${halls.length + 1}`;
  }

  function updatePreview () {
    previewEl.textContent = getNextHallName();
  }

  function getFixedItemsPerPage () {
    const value = itemsPerPageSelect.value;
    if (value === 'auto') {
      return null;
    }
    return Number.parseInt(value, 10) || null;
  }

  let halls = [];
  let newlyCreatedId = null;

  const paginator = createResponsivePaginator({
    listEl: gridEl,
    controlsEl,
    estimateItemHeightPx: 90,
    bottomReservePx: 60,
    getFixedItemsPerPage,
    getItems: () => halls,
    renderItem: (hall) => {
      const isNew = hall._id === newlyCreatedId;
      return `
        <button type="button"
          class="hall-card${isNew ? ' hall-card--new' : ''}"
          data-hall-id="${hall._id}"
          data-name="${hall.name}"
          data-rows="${hall.rows}"
          data-seats-per-row="${hall.seatsPerRow}">
          <div class="hall-card-header">
            <span class="hall-name">${hall.name}</span>
            ${isNew ? '<span class="hall-new-badge">Neu</span>' : ''}
          </div>
          <div class="hall-meta">${hall.rows} Reihen · ${hall.seatsPerRow} Sitze/ Reihe</div>
        </button>
      `;
    }
  });

  itemsPerPageSelect.addEventListener('change', () => {
    paginator.render();
  });

  // Number input buttons
  formEl.addEventListener('click', (event) => {
    const btn = event.target.closest('.number-btn');
    if (!btn) return;

    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const min = Number.parseInt(input.min, 10) || 1;
    const current = Number.parseInt(input.value, 10) || min;

    if (btn.classList.contains('number-btn--plus')) {
      input.value = current + 1;
    } else if (btn.classList.contains('number-btn--minus')) {
      input.value = Math.max(min, current - 1);
    }
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
      const name = getNextHallName();
      const rows = Number.parseInt(rowsInput.value, 10);
      const seatsPerRow = Number.parseInt(seatsInput.value, 10);

      if (!Number.isFinite(rows) || rows <= 0 || !Number.isFinite(seatsPerRow) || seatsPerRow <= 0) {
        messageEl.textContent = 'Bitte gültige Werte für Reihen und Sitze pro Reihe angeben.';
        return;
      }

      messageEl.textContent = 'Lege neuen Saal an...';
      messageEl.classList.remove('message--success');

      const created = await apiPost('/halls', {
        name,
        rows,
        seatsPerRow
      });

      newlyCreatedId = created._id;
      halls = await apiGet('/halls');

      // Zur letzten Seite springen, damit der neue Saal sichtbar ist
      const perPage = Math.max(1, Math.floor((window.innerHeight - 500) / 90));
      const lastPage = Math.max(0, Math.ceil(halls.length / perPage) - 1);
      paginator.setPageIndex(lastPage);
      updatePreview();

      messageEl.textContent = `Kinosaal "${name}" wurde erfolgreich angelegt.`;
      messageEl.classList.add('message--success');

      // Nach 3 Sekunden: Erfolgsmeldung ausblenden und "Neu"-Badge entfernen
      setTimeout(() => {
        newlyCreatedId = null;
        messageEl.textContent = '';
        messageEl.classList.remove('message--success');
        paginator.render();
      }, 3000);
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
    updatePreview();
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden der Kinosäle.';
  }

  return () => {
    paginator.destroy();
  };
}
