// client/src/js/homeView.js

export function renderHomeView (app, navigateTo, state, setRole) {
  app.innerHTML = `
    <section>
      <h2>Willkommen zur Kinoverwaltung</h2>
      <p>Bitte Rolle auswählen (keine Authentifizierung).</p>
      <div class="home-buttons">
        <div>
          <h3>Kunde</h3>
          <button type="button" id="choose-customer">Als Kunde fortfahren</button>
        </div>
        <div>
          <h3>Betreiber</h3>
          <button type="button" id="choose-operator">Als Betreiber fortfahren</button>
        </div>
      </div>
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
    const label = state.role === 'operator' ? 'Betreiber' : 'Kunde';
    const continueWrapper = document.createElement('div');
    const continueBtn = document.createElement('button');
    continueBtn.type = 'button';
    continueBtn.textContent = `Weiter als ${label}`;
    continueBtn.addEventListener('click', () => {
      navigateTo(state.role === 'operator' ? 'operatorHome' : 'customerHome');
    });
    continueWrapper.appendChild(continueBtn);
    app.querySelector('.home-buttons')?.appendChild(continueWrapper);
  }
}
