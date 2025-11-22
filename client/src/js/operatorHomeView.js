// client/src/js/operatorHomeView.js

export function renderOperatorHomeView (app, navigateTo) {
  app.innerHTML = `
    <section>
      <h2>Betreiber Bereich</h2>
      <p>Betreiber Bereich</p>
      <button type="button" id="back-home">Zurück zur Auswahl</button>
    </section>
  `;

  const backBtn = document.getElementById('back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('home'));
  }
}
