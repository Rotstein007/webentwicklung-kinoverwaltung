// client/src/js/homeView.js

export function renderHomeView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Willkommen zur Kinoverwaltung</h2>
      <p>Seiten:</p>
      <div class="home-buttons">
        <h3>Kunde</h3>
        <button type="button" id="go-customer-home">Kunden-Startseite</button>
        <button type="button" id="go-customer-reservation">Reservierungsseite</button>
        <button type="button" id="go-ticket">Ticketseite</button>

        <h3>Betreiber</h3>
        <button type="button" id="go-operator-home">Betreiber-Startseite</button>
        <button type="button" id="go-operator-halls">Kinosaalverwaltung</button>
        <button type="button" id="go-operator-shows">Vorstellungen</button>

        <h3>Sonstiges</h3>
        <button type="button" id="go-404">404-Seite testen</button>
      </div>
    </section>
  `;

  const btnCustomerHome = document.getElementById('go-customer-home');
  if (btnCustomerHome) {
    btnCustomerHome.addEventListener('click', () => navigateTo('customerHome'));
  }

  const btnCustomerReservation = document.getElementById('go-customer-reservation');
  if (btnCustomerReservation) {
    btnCustomerReservation.addEventListener('click', () => navigateTo('customerReservation'));
  }

  const btnTicket = document.getElementById('go-ticket');
  if (btnTicket) {
    btnTicket.addEventListener('click', () => navigateTo('ticket'));
  }

  const btnOperatorHome = document.getElementById('go-operator-home');
  if (btnOperatorHome) {
    btnOperatorHome.addEventListener('click', () => navigateTo('operatorHome'));
  }

  const btnOperatorHalls = document.getElementById('go-operator-halls');
  if (btnOperatorHalls) {
    btnOperatorHalls.addEventListener('click', () => navigateTo('operatorHalls'));
  }

  const btnOperatorShows = document.getElementById('go-operator-shows');
  if (btnOperatorShows) {
    btnOperatorShows.addEventListener('click', () => navigateTo('operatorShows'));
  }

  const btn404 = document.getElementById('go-404');
  if (btn404) {
    // absichtlich eine unbekannte Seite, um den Fallback zu triggern
    btn404.addEventListener('click', () => navigateTo('doesNotExist'));
  }
}
