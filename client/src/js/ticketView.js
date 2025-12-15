import qrcode from 'qrcode-generator';
import { apiGet } from './api.js';

/**
 * Rendert die Ticket-Seite inkl. QR-Code.
 * @param {HTMLElement} app - Root-Element (#app)
 * @param {Object} state - Globaler State (z.B. aktuelles Ticket)
 * @param {Function} navigateTo - Funktion zum Seitenwechsel
 */
export async function renderTicketView (app, state, navigateTo) {
  state.role = 'customer';

  const reservationId = state?.params?.reservationId;
  if (!reservationId) {
    app.innerHTML = `
      <section>
        <h2>Ticket</h2>
        <p>Keine Reservierungs-ID vorhanden.</p>
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
      <h2>Ticket</h2>
      <div class="toolbar">
        <button type="button" id="back">Zurück</button>
        <button type="button" id="print">Drucken</button>
      </div>
      <div id="ticket-message" class="message"></div>
      <div id="ticket-details" class="card"></div>
      <div class="ticket-qr" id="ticket-qr"></div>
    </section>
  `;

  const messageEl = document.getElementById('ticket-message');
  const detailsEl = document.getElementById('ticket-details');
  const qrEl = document.getElementById('ticket-qr');

  const backBtn = document.getElementById('back');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('customerHome'));
  }

  const printBtn = document.getElementById('print');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  if (!messageEl || !detailsEl || !qrEl) {
    return null;
  }

  try {
    messageEl.textContent = 'Lade Ticket...';
    const reservation = await apiGet(`/reservations/${reservationId}`);

    const show = reservation?.show;
    const hall = reservation?.hall;
    const seats = Array.isArray(reservation?.seatCodes) ? reservation.seatCodes : [];

    const payload = JSON.stringify({
      reservationId: String(reservation._id),
      showId: reservation?.showId ? String(reservation.showId) : null,
      seatCodes: seats
    });

    const qr = qrcode(0, 'L');
    qr.addData(payload);
    qr.make();

    messageEl.textContent = '';
    detailsEl.innerHTML = `
      <div class="card-title">${show?.movieTitle || 'Unbekannter Film'}</div>
      <div class="card-meta">${show?.startsAt ? new Date(show.startsAt).toLocaleString('de-DE') : ''}</div>
      <div class="card-meta">Saal: ${hall?.name || ''}</div>
      <div class="card-meta">Name: ${reservation?.customerName || ''}</div>
      <div class="card-meta">Sitze: ${seats.join(', ')}</div>
      <div class="card-meta">Reservierungs-ID: ${reservation._id}</div>
    `;

    qrEl.innerHTML = qr.createImgTag(6, 0);
  } catch (err) {
    console.error(err);
    messageEl.textContent = 'Fehler beim Laden des Tickets.';
  }

  return null;
}
