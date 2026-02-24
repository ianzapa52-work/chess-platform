// @ts-check

window.addEventListener("load", () => {
  const containerMaybe = document.getElementById("history-container");
  const loadingMaybe = document.getElementById("loadingHistory");

  if (!(containerMaybe instanceof HTMLElement)) throw new Error("Missing #history-container");
  if (!(loadingMaybe instanceof HTMLElement)) throw new Error("Missing #loadingHistory");

  const container = containerMaybe;
  const loading = loadingMaybe;

  /**
   * @typedef {"online" | "ia" | "local"} GameMode
   * @typedef {"win" | "loss" | "draw"} GameResult
   */

  /** @type {{
    id: string,
    mode: GameMode,
    result: GameResult,
    date: string,
    moves: number
  }[]} */
  const dummyHistory = [
    { id: "1", mode: "online", result: "win", date: "2026-02-20", moves: 42 },
    { id: "2", mode: "ia", result: "loss", date: "2026-02-18", moves: 31 },
    { id: "3", mode: "local", result: "draw", date: "2026-02-15", moves: 58 },
    { id: "4", mode: "online", result: "win", date: "2026-02-20", moves: 42 },
    { id: "5", mode: "ia", result: "loss", date: "2026-02-18", moves: 31 },
    { id: "6", mode: "local", result: "draw", date: "2026-02-15", moves: 58 },
    { id: "7", mode: "online", result: "win", date: "2026-02-20", moves: 42 },
    { id: "8", mode: "ia", result: "loss", date: "2026-02-18", moves: 31 },
    { id: "9", mode: "local", result: "draw", date: "2026-02-15", moves: 58 }
  ];

  /** @type {Record<GameMode, string>} */
  const modeLabels = {
    online: "Online",
    ia: "VS IA",
    local: "Local"
  };

  /** @type {Record<GameResult, string>} */
  const resultLabels = {
    win: "Victoria",
    loss: "Derrota",
    draw: "Tablas"
  };

  /** @type {Record<GameResult, string>} */
  const resultColors = {
    win: "text-green-700",
    loss: "text-red-700",
    draw: "text-yellow-700"
  };

  /**
   * @param {{
   *  id: string,
   *  mode: GameMode,
   *  result: GameResult,
   *  date: string,
   *  moves: number
   * }} game
   */
  function renderGame(game) {
    const card = document.createElement("div");
    card.className = "history-card";

    card.innerHTML = `
      <div class="history-left">
        <p class="${resultColors[game.result]}">${resultLabels[game.result]}</p>
        <p>${modeLabels[game.mode]}</p>
      </div>

      <div class="history-right">
        <p>${new Date(game.date).toLocaleDateString("es-ES")}</p>
        <p>${game.moves} movimientos</p>
      </div>
    `;

    card.addEventListener("click", () => {
      alert(`Aquí se abrirá la partida ${game.id} (cuando exista backend)`);
    });

    return card;
  }

  function loadHistory() {
    loading.style.display = "none";
    dummyHistory.forEach((game) => container.appendChild(renderGame(game)));
  }

  loadHistory();
});
