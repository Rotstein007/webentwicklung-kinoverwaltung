// client/src/js/homeView.js

export function renderHomeView (app, navigateTo, state, setRole) {
  app.innerHTML = `
    <section class="role-selection">
      <button type="button" class="role-card" id="choose-customer">
        <div class="role-card-header">
          <span class="role-chip">Kunde</span>
        </div>
        <div class="role-card-title">Tickets reservieren</div>
        <div class="role-card-text">Vorstellungen ansehen, Plätze wählen und dein Ticket mit QR-Code sichern.</div>
        <div class="role-card-cta">Als Kunde fortfahren →</div>
      </button>
      <button type="button" class="role-card" id="choose-operator">
        <div class="role-card-header">
          <span class="role-chip">Betreiber</span>
        </div>
        <div class="role-card-title">Vorstellungen verwalten</div>
        <div class="role-card-text">Kinosäle anlegen, Shows planen und den Betrieb im Blick behalten.</div>
        <div class="role-card-cta">Als Betreiber fortfahren →</div>
      </button>
    </section>
  `;

  const btnCustomer = document.getElementById('choose-customer');
  if (btnCustomer) {
    btnCustomer.addEventListener('click', () => setRole('customer'));
  }

  const btnOperator = document.getElementById('choose-operator');
  if (btnOperator) {
    btnOperator.addEventListener('click', () => setRole('operator'));
  }

  if (state?.role) {
    state.role = null;
  }
}
