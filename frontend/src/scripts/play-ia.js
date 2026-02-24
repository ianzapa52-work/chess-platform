// @ts-check
import { Chess } from "chess.js";

/** @typedef {import("chess.js").Square} Square */
/** @typedef {import("chess.js").Move} ChessMove */

window.addEventListener("load", () => {
  // NARROWING DE ELEMENTOS

  const boardMaybe = document.getElementById("board");
  if (!(boardMaybe instanceof HTMLElement)) throw new Error("Missing #board");
  const boardEl = boardMaybe;

  const moveBodyMaybe = document.getElementById("move-body");
  if (!(moveBodyMaybe instanceof HTMLTableSectionElement)) throw new Error("Missing #move-body");
  const moveBody = moveBodyMaybe;

  const statusMaybe = document.getElementById("game-status");
  if (!(statusMaybe instanceof HTMLElement)) throw new Error("Missing #game-status");
  const statusEl = statusMaybe;

  const capturedWhiteMaybe = document.getElementById("captured-white");
  if (!(capturedWhiteMaybe instanceof HTMLElement)) throw new Error("Missing #captured-white");
  const capturedWhite = capturedWhiteMaybe;

  const capturedBlackMaybe = document.getElementById("captured-black");
  if (!(capturedBlackMaybe instanceof HTMLElement)) throw new Error("Missing #captured-black");
  const capturedBlack = capturedBlackMaybe;

  const levelMaybe = document.getElementById("ai-level");
  if (!(levelMaybe instanceof HTMLSelectElement)) throw new Error("Missing #ai-level");
  const levelSelect = levelMaybe;

  // CHESS.JS

  const game = new Chess();

  /** @type {Square | null} */
  let selectedSquare = null;

  // HISTORIAL

  for (let i = 0; i < 60; i++) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${i + 1}</td><td></td><td></td>`;
    moveBody.appendChild(row);
  }

  // UTILIDADES

  /**
   * @param {{color:"w"|"b", type:"p"|"r"|"n"|"b"|"q"|"k"}} piece
   */
  function getPieceImage(piece) {
    const color = piece.color === "w" ? "white" : "black";
    const map = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
    return `/pieces/${color[0]}_${map[piece.type]}.svg`;
  }

  /**
   * @param {Square} square
   */
  function squareToCoord(square) {
    return {
      row: 8 - Number(square[1]),
      col: square.charCodeAt(0) - 97
    };
  }

  /**
   * @param {number} row
   * @param {number} col
   * @returns {Square}
   */
  function coordToSquare(row, col) {
    return /** @type {Square} */ (
      String.fromCharCode(97 + col) + (8 - row)
    );
  }

  // ESTADO DEL JUEGO

  function updateGameStatus() {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "negras" : "blancas";
      statusEl.textContent = `Jaque mate: ganan las ${winner}`;
      return;
    }

    if (game.isStalemate() || game.isDraw()) {
      statusEl.textContent = "Tablas";
      return;
    }

    if (game.inCheck()) {
      const side = game.turn() === "w" ? "blancas" : "negras";
      statusEl.textContent = `Jaque a las ${side}`;
      return;
    }

    statusEl.textContent =
      "Turno de las " + (game.turn() === "w" ? "blancas" : "negras");
  }

  function updateHistory() {
    const history = game.history();
    const rows = moveBody.querySelectorAll("tr");

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll("td");
      if (cells.length < 3) continue;
      cells[1].textContent = history[i * 2] ?? "";
      cells[2].textContent = history[i * 2 + 1] ?? "";
    }
  }

  /**
   * @param {ChessMove} move
   */
  function registerCapture(move) {
    if (!move.captured) return;

    const capturedColor = move.color === "w" ? "black" : "white";
    const container = capturedColor === "white" ? capturedWhite : capturedBlack;

    const map = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
    const img = document.createElement("img");
    img.src = `/pieces/${capturedColor[0]}_${map[move.captured]}.svg`;
    img.alt = "";
    img.classList.add("w-8", "h-8");
    container.appendChild(img);
  }

  /**
   * @param {Square} from
   * @param {Square} to
   * @param {ChessMove} move
   */
  function updateSingleMove(from, to, move) {
    const { row: fromRow, col: fromCol } = squareToCoord(from);
    const { row: toRow, col: toCol } = squareToCoord(to);

    const fromSq = boardEl.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const toSq = boardEl.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);

    if (!(fromSq instanceof HTMLElement) || !(toSq instanceof HTMLElement)) return;

    fromSq.innerHTML = "";

    const piece = game.get(to);
    if (piece) {
      const img = document.createElement("img");
      img.src = getPieceImage(piece);
      img.alt = "";
      img.className = "piece";
      img.draggable = true;
      enableDrag(img, toRow, toCol);
      toSq.innerHTML = "";
      toSq.appendChild(img);
    }
  }

  function renderBoard() {
    const state = game.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const sq = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!(sq instanceof HTMLElement)) continue;

        sq.innerHTML = "";
        const piece = state[row][col];

        if (piece) {
          const img = document.createElement("img");
          img.src = getPieceImage(piece);
          img.alt = "";
          img.className = "piece";
          img.draggable = true;

          enableDrag(img, row, col);
          sq.appendChild(img);
        }
      }
    }
  }

  async function aiMove() {
    const fen = game.fen();
    const level = Number(levelSelect.value);

    const res = await fetch("/api/stockfish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, level })
    });

    const data = await res.json();

    /** @type {Square} */
    const from = data.from;
    /** @type {Square} */
    const to = data.to;

    const move = game.move({ from, to, promotion: "q" });
    if (!move) return;

    registerCapture(move);
    updateSingleMove(from, to, move);
    updateHistory();
    updateGameStatus();
  }

  // DRAG & DROP

  /**
   * @param {HTMLImageElement} img
   * @param {number} row
   * @param {number} col
   */
  function enableDrag(img, row, col) {
    img.addEventListener("dragstart", (e) => {
      if (!e.dataTransfer) return;

      /** @type {Square} */
      const from = coordToSquare(row, col);
      const piece = game.get(from);

      if (!piece || piece.color !== "w" || game.turn() !== "w") {
        e.preventDefault();
        return;
      }

      e.dataTransfer.setData("text/plain", from);
      selectedSquare = from;
    });
  }

  /**
   * @param {number} row
   * @param {number} col
   */
  function handleSquareClick(row, col) {
    if (game.turn() !== "w") return;

    const target = coordToSquare(row, col);
    const pieceHere = game.get(target);

    if (!selectedSquare) {
      if (pieceHere && pieceHere.color === "w") {
        selectedSquare = target;
      }
      return;
    }

    const move = game.move({
      from: selectedSquare,
      to: target,
      promotion: "q"
    });

    if (!move) return;

    registerCapture(move);
    updateSingleMove(selectedSquare, target, move);
    updateHistory();
    updateGameStatus();

    selectedSquare = null;

    setTimeout(aiMove, 200);
  }

  // CREAR CASILLAS

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.row = String(row);
      square.dataset.col = String(col);

      const isDark = (row + col) % 2 === 1;
      square.classList.add(isDark ? "dark" : "light");

      square.addEventListener("click", () => handleSquareClick(row, col));

      boardEl.appendChild(square);
    }
  }

  renderBoard();
  updateGameStatus();
});
