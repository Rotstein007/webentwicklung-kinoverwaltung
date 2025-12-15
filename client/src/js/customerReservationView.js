import { apiGet, apiPost } from './api.js';

function seatCode (row, seat) {
  return `${row}:${seat}`;
}

function seatLabel (code) {
  const [rowStr, seatStr] = String(code).split(':');
  return `Reihe ${rowStr}, Sitz ${seatStr}`;
}

export async function renderCustomerReservationView (app, navigateTo, state) {
  state.role = 'customer';

  const showId = state?.params?.showId;
  if (!showId) {
    app.innerHTML = `
      <section>
        <h2>Reservierung</h2>
        <p>Bitte zuerst eine Vorstellung auswählen.</p>
        <button type="button" id="back">Zurück</button>
      </section>
    `;

    const backBtn = document.getElementById('back');
    if (backBtn) {
      backBtn.addEventListener('click', () => navigateTo('customerHome'));
    }
    return null;
  }

  app.innerHTML = `
    <section>
      <h2>Reservierung</h2>
      <div class="toolbar">
        <button type="button" id="back">Zurück</button>
      </div>

      <div id="reservation-message" class="message"></div>

      <div id="show-summary" class="card"></div>

      <h3>Sitzplätze</h3>
      <div class="seat-legend">
        <span class="seat-legend-item"><span class="seat seat--free" aria-hidden="true"></span> frei</span>
        <span class="seat-legend-item"><span class="seat seat--selected" aria-hidden="true"></span> ausgewählt</span>
        <span class="seat-legend-item"><span class="seat seat--occupied" aria-hidden="true"></span> belegt</span>
      </div>

      <div id="seat-grid" class="seat-grid" aria-label="Sitzplan"></div>

      <form id="reservation-form" class="form" autocomplete="off">
        <div class="form-row">
          <label for="customer-name">Name</label>
          <input id="customer-name" name="customerName" type="text" placeholder="z.B. Max Mustermann" />
        </div>
        <div class="form-row">
          <label>Ausgewählt</label>
          <div id="selected-seats" class="selected-seats">–</div>
        </div>
        <div class="form-actions">
          <button type="submit" id="submit" disabled>Reservieren</button>
        </div>
      </form>
    </section>
  `;

  const messageEl = document.getElementById('reservation-message');
  const showSummaryEl = document.getElementById('show-summary');
  const seatGridEl = document.getElementById('seat-grid');
  const selectedSeatsEl = document.getElementById('selected-seats');
  const formEl = document.getElementById('reservation-form');
  const submitBtn = document.getElementById('submit');
  const nameInput = document.getElementById('customer-name');

  const backBtn = document.getElementById('back');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('customerHome'));
  }

  if (!messageEl || !showSummaryEl || !seatGridEl || !selectedSeatsEl || !formEl || !submitBtn || !nameInput) {
    return null;
  }

  const selected = new Set();
  let occupiedSeatCodes = [];
  let show;

  function updateSelectedUi () {
    const items = [...selected].sort((a, b) => a.localeCompare(b));
    selectedSeatsEl.textContent = items.length === 0 ? '–' : items.map(seatLabel).join(', ');

    const hasName = nameInput.value.trim().length > 0;
    submitBtn.disabled = !(items.length > 0 && hasName);
  }

  function renderSeatGrid (hall) {
    seatGridEl.style.gridTemplateColumns = `repeat(${hall.seatsPerRow}, 1fr)`;
    const occupiedSet = new Set(occupiedSeatCodes);

    const html = [];
    for (let row = 1; row <= hall.rows; row += 1) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat += 1) {
        const code = seatCode(row, seat);
        const isOccupied = occupiedSet.has(code);
        const isSelected = selected.has(code);
        const classes = [
          'seat',
          isOccupied ? 'seat--occupied' : 'seat--free',
          isSelected ? 'seat--selected' : ''
        ].filter(Boolean).join(' ');

        html.push(`
          <button
            type="button"
            class="${classes}"
            data-seat-code="${code}"
            ${isOccupied ? 'disabled' : ''}
            aria-label="${seatLabel(code)}">
          </button>
        `);
      }
    }

    seatGridEl.innerHTML = html.join('');
  }

  seatGridEl.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-seat-code]');
    if (!btn || btn.disabled) {
      return;
    }

    const code = btn.dataset.seatCode;
    if (!code) {
      return;
    }

    if (selected.has(code)) {
      selected.delete(code);
    } else {
      selected.add(code);
    }

    btn.classList.toggle('seat--selected', selected.has(code));
    updateSelectedUi();
  });

  nameInput.addEventListener('input', updateSelectedUi);

  try {
    messageEl.textContent = 'Lade Vorstellung...';
    show = await apiGet(`/shows/${showId}`);
    const occupied = await apiGet(`/shows/${showId}/occupied-seats`);
    occupiedSeatCodes = occupied?.seatCodes || [];

    const hall = show?.hall;
    if (!hall) {
      messageEl.textContent = 'Kinosaal zur Vorstellung nicht gefunden.';
      return null;
    }

    showSummaryEl.innerHTML = `
      <div class="card-title">${show.movieTitle || 'Unbekannter Film'}</div>
      <div class="card-meta">${new Date(show.startsAt).toLocaleString('de-DE')}</div>
      <div class="card-meta">Saal: ${hall.name}</div>
    `;

    messageEl.textContent = '';
    renderSeatGrid(hall);
    updateSelectedUi();
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden der Reservierungsdaten.';
    return null;
  }

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();

    const customerName = nameInput.value.trim();
    const seatCodes = [...selected];

    if (!customerName || seatCodes.length === 0) {
      updateSelectedUi();
      return;
    }

    try {
      submitBtn.disabled = true;
      messageEl.textContent = 'Reserviere Sitzplätze...';

      const created = await apiPost('/reservations', {
        showId,
        customerName,
        seatCodes
      });

      const reservationId = created?._id;
      if (!reservationId) {
        throw new Error('Keine Reservierungs-ID erhalten.');
      }

      navigateTo('ticket', { reservationId: String(reservationId) });
    } catch (err) {
      console.error(err);
      if (err.status === 409) {
        messageEl.textContent = 'Mindestens ein Sitzplatz wurde gerade bereits reserviert. Bitte neu auswählen.';
        selected.clear();
        try {
          const occupied = await apiGet(`/shows/${showId}/occupied-seats`);
          occupiedSeatCodes = occupied?.seatCodes || [];
          renderSeatGrid(show.hall);
        } catch (reloadErr) {
          console.error(reloadErr);
        }
      } else {
        messageEl.textContent = 'Fehler beim Anlegen der Reservierung.';
      }
    } finally {
      updateSelectedUi();
    }
  });

  return null;
}
