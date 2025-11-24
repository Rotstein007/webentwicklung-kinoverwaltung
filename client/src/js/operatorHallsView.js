// client/src/js/operatorHallsView.js

const API_BASE = '/api';

async function fetchHalls () {
  const response = await fetch(`${API_BASE}/halls`);

  if (!response.ok) {
    throw new Error('Fehler beim Laden der Kinosäle');
  }

  return await response.json();
}

async function createHall (hallData) {
  const response = await fetch(`${API_BASE}/halls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hallData || {})
  });

  if (response.status === 409) {
    throw new Error('NAME_EXISTS');
  }

  if (!response.ok) {
    throw new Error('Fehler beim Anlegen eines Kinosaals');
  }

  return await response.json();
}

async function deleteHall (id) {
  const response = await fetch(`${API_BASE}/halls/${id}`, {
    method: 'DELETE'
  });

  if (response.status === 404) {
    throw new Error('NOT_FOUND');
  }

  if (!response.ok && response.status !== 204) {
    throw new Error('Fehler beim Löschen eines Kinosaals');
  }
}

function renderHallGrid (halls) {
  const grid = document.getElementById('halls-grid');
  if (!grid) {
    return;
  }

  grid.innerHTML = halls.map(hall => `
    <button class="hall-card" type="button"
      data-id="${hall._id}"
      data-name="${hall.name}"
      data-rows="${hall.rows}"
      data-seats="${hall.seatsPerRow}">
      <span class="hall-name">${hall.name}</span>
      <button class="hall-delete-button" type="button" data-id="${hall._id}" aria-label="Kinosaal löschen">
        <span class="icon hall-delete-icon" aria-hidden="true">delete</span>
      </button>
    </button>
  `).join('');
}

function openHallModal (hall) {
  const existing = document.getElementById('hall-modal');
  if (existing) {
    existing.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'hall-modal';
  modal.className = 'hall-modal';

  modal.innerHTML = `
    <div class="hall-modal-backdrop"></div>
    <div class="hall-modal-content">
      <header class="hall-modal-header">
        <h3>${hall.name}</h3>
        <button type="button" class="hall-modal-close" aria-label="Schließen">
          <span class="icon">close</span>
        </button>
      </header>
      <div class="hall-modal-body">
        <p><strong>Name:</strong> ${hall.name}</p>
        <p><strong>Reihen:</strong> ${hall.rows}</p>
        <p><strong>Sitze pro Reihe:</strong> ${hall.seatsPerRow}</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.hall-modal-close');
  const backdrop = modal.querySelector('.hall-modal-backdrop');

  const close = () => {
    modal.remove();
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
}

export async function renderOperatorHallsView (app, navigateTo) {
  app.innerHTML = `
    <section class="hall-section">
      <h2>Kinosaalverwaltung</h2>
      <p>Verwaltung der Kinosäle.</p>

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
        <div class="halls-controls">
          <button type="button" id="add-hall">+</button>
          <button type="button" id="back-home">Zurück zur Auswahl</button>
        </div>
      </form>

      <div id="halls-grid" class="halls-grid"></div>
      <p id="halls-message"></p>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }

  const addBtn = document.getElementById('add-hall');
  const messageEl = document.getElementById('halls-message');
  const nameInput = document.getElementById('hall-name');
  const rowsInput = document.getElementById('hall-rows');
  const seatsInput = document.getElementById('hall-seats');
  const grid = document.getElementById('halls-grid');

  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      try {
        const name = nameInput.value.trim();
        const rows = Number.parseInt(rowsInput.value, 10);
        const seatsPerRow = Number.parseInt(seatsInput.value, 10);

        if (!Number.isFinite(rows) || rows <= 0 || !Number.isFinite(seatsPerRow) || seatsPerRow <= 0) {
          messageEl.textContent = 'Bitte gültige Werte für Reihen und Sitze pro Reihe angeben.';
          return;
        }

        messageEl.textContent = 'Lege neuen Saal an...';

        await createHall({
          name: name || undefined,
          rows,
          seatsPerRow
        });

        const halls = await fetchHalls();
        renderHallGrid(halls);
        messageEl.textContent = '';
        nameInput.value = '';
      } catch (err) {
        console.error(err);
        if (err.message === 'NAME_EXISTS') {
          messageEl.textContent = 'Es existiert bereits ein Saal mit diesem Namen.';
        } else {
          messageEl.textContent = 'Fehler beim Anlegen des Saals.';
        }
      }
    });
  }

  if (grid) {
    grid.addEventListener('click', async (event) => {
      const deleteButton = event.target.closest('.hall-delete-button');
      const card = event.target.closest('.hall-card');

      if (deleteButton && deleteButton.dataset.id) {
        const id = deleteButton.dataset.id;
        const name = deleteButton.closest('.hall-card')?.dataset.name || '';

        const confirmed = window.confirm(`Möchtest du den Saal "${name}" wirklich löschen?`);
        if (!confirmed) {
          return;
        }

        try {
          await deleteHall(id);
          const halls = await fetchHalls();
          renderHallGrid(halls);
        } catch (err) {
          console.error(err);
          messageEl.textContent = 'Fehler beim Löschen des Saals.';
        }
        return;
      }

      if (card && !deleteButton) {
        const hall = {
          id: card.dataset.id,
          name: card.dataset.name,
          rows: Number.parseInt(card.dataset.rows, 10),
          seatsPerRow: Number.parseInt(card.dataset.seats, 10)
        };
        openHallModal(hall);
      }
    });
  }

  try {
    messageEl.textContent = 'Lade Kinosäle...';
    const halls = await fetchHalls();
    renderHallGrid(halls);
    messageEl.textContent = '';
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden der Kinosäle.';
  }
}
