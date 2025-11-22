// client/src/js/operatorHallsView.js

export function renderOperatorHallsView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Kinosaalverwaltung</h2>
      <p>Verwaltung der Kinosäle.</p>
      <button type="button" id="back-home">Zurück zur Auswahl</button>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}
