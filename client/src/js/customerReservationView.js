// client/src/js/customerReservationView.js

export function renderCustomerReservationView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Reservierungen</h2>
      <p>Reservierungsseite für Kunden.</p>
      <button type="button" id="back-home">Zurück zur Auswahl</button>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}
