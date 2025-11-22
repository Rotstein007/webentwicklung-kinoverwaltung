// client/src/js/operatorShowsView.js

export function renderOperatorShowsView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Vorstellungen</h2>
      <p>Übersicht und Verwaltung von Vorstellungen.</p>
      <button type="button" id="back-home">Zurück zur Auswahl</button>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}
