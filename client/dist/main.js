(() => {
  // client/src/js/main.js
  function renderInitialView() {
    const app = document.getElementById("app");
    app.innerHTML = `
    <section>
      <h2>Willkommen zur Kinoverwaltung</h2>
      <p>Hier kommt sp\xE4ter die Rollenwahl (Betreiber / Kunde).</p>
    </section>
  `;
  }
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Client-App gestartet");
    renderInitialView();
  });
})();
