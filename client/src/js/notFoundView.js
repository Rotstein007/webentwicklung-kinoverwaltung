// client/src/js/notFoundView.js

export function renderNotFoundView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Seite nicht gefunden</h2>
      <p>Die angeforderte Seite existiert nicht.</p>
      <button type="button" id="back-home">Zurück zur Auswahl</button>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}
