// client/src/js/customerHomeView.js

export function renderCustomerHomeView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Startseite</h2>
      <p>Kunden-Home.</p>
      <button type="button" id="back-home">Zurück zur Auswahl</button>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}
