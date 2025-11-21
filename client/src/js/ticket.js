// client/src/js/ticket.js
import qrcode from 'qrcode-generator';

/**
 * Rendert die Ticket-Seite inkl. QR-Code.
 * Erwartet, dass state.ticket existiert und alle nötigen Felder hat.
 * @param {HTMLElement} app - Root-Element (#app)
 * @param {Object} state - Globaler State (z.B. aktuelles Ticket)
 * @param {Function} navigateTo - Funktion zum Seitenwechsel
 */
export function renderTicketView (app, state, navigateTo) {
  const { ticket } = state;

  if (!ticket) {
    console.error('Kein Ticket im State vorhanden.');
    app.innerHTML = `
      <section>
        <p>Kein Ticket gefunden.</p>
        <button id="back-home">Zurück zur Startseite</button>
      </section>
    `;
    const backBtn = document.getElementById('back-home');
    if (backBtn) {
      backBtn.addEventListener('click', () => navigateTo('home'));
    }
    return;
  }

  const { vorname, nachname, film, sitzplatz } = ticket;

  const typeNumber = 4;
  const errorCorrectionLevel = 'L';
  const qr = qrcode(typeNumber, errorCorrectionLevel);

  // Hier werden nur die Rohdaten in den QR-Code gepackt,
  // aber NICHT nochmal separat angezeigt.
  qr.addData(`${vorname}, ${nachname}, ${film}, ${sitzplatz}`);
  qr.make();

  app.innerHTML = `
    <section>
      <h2>Ticket</h2>
      <div class="ticket-qr">
        ${qr.createImgTag()}
      </div>
      <button id="back-home">Zurück zur Startseite</button>
    </section>
  `;

  const backButton = document.getElementById('back-home');
  if (backButton) {
    backButton.addEventListener('click', () => navigateTo('home'));
  }
}
