// client/src/js/operatorHomeView.js

export function renderOperatorHomeView (app, navigateTo, state, setRole) {
  app.innerHTML = `
    <section>
      <h2>Betreiber Bereich</h2>
      <p>Du kannst Kinosäle und Vorstellungen anlegen.</p>
      <div class="home-buttons">
        <button type="button" id="go-halls">Kinosäle anlegen</button>
        <button type="button" id="go-shows">Vorstellungen anlegen</button>
        <button type="button" id="switch-role">Rolle wechseln</button>
      </div>
    </section>
  `;

  const goHalls = document.getElementById('go-halls');
  if (goHalls) {
    goHalls.addEventListener('click', () => navigateTo('operatorHalls'));
  }

  const goShows = document.getElementById('go-shows');
  if (goShows) {
    goShows.addEventListener('click', () => navigateTo('operatorShows'));
  }

  const switchRoleBtn = document.getElementById('switch-role');
  if (switchRoleBtn) {
    switchRoleBtn.addEventListener('click', () => {
      setRole(null);
    });
  }

  state.role = 'operator';
}
