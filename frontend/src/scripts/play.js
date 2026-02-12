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
   * @returns {string}
   */
  function getPieceImage(piece) {
    const color = piece.color === "w" ? "white" : "black";
    const map = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
    return `/pieces/${color[0]}_${map[piece.type]}.svg`;
  }

  /**
   * @param {Element | null} el
   */
  function highlightSquare(el) {
    const prev = boardEl.querySelector(".selected");
    if (prev) prev.classList.remove("selected");
    if (el instanceof HTMLElement) el.classList.add("selected");
  }

  function clearLegalMoves() {
    boardEl.querySelectorAll(".legal-move").forEach((sq) => {
      sq.classList.remove("legal-move");
    });
  }

  /**
   * @param {Square[]} targets
   */
  function highlightLegalMoves(targets) {
    clearLegalMoves();
    for (const sq of targets) {
      const { row, col } = squareToCoord(sq);
      const el = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (el instanceof HTMLElement) el.classList.add("legal-move");
    }
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

  /**
   * @param {Square} square
   */
  function squareToCoord(square) {
    return {
      row: 8 - Number(square[1]),
      col: square.charCodeAt(0) - 97
    };
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

  // MOVIMIENTO SUAVE (solo actualiza 2 casillas)

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

    // limpiar origen
    fromSq.innerHTML = "";

    // poner pieza en destino
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

  // RENDER INICIAL DEL TABLERO

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
      if (!piece || piece.color !== game.turn()) {
        e.preventDefault();
        return;
      }

      e.dataTransfer.setData("text/plain", from);
      selectedSquare = from;

      const sqEl = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      highlightSquare(sqEl);

      const moves = game.moves({ square: from, verbose: true });
      highlightLegalMoves(moves.map((m) => m.to));
    });
  }

  // CLICK PARA MOVER

  /**
   * @param {number} row
   * @param {number} col
   */
  function handleSquareClick(row, col) {
    const target = coordToSquare(row, col);
    const pieceHere = game.get(target);

    // 1. Si NO hay pieza seleccionada
    if (!selectedSquare) {
      if (pieceHere && pieceHere.color === game.turn()) {
        selectedSquare = target;

        const sqEl = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        highlightSquare(sqEl);

        const moves = game.moves({ square: target, verbose: true });
        highlightLegalMoves(moves.map((m) => m.to));
      }
      return;
    }

    // 2. Si haces clic en otra pieza del mismo color → CAMBIAR SELECCIÓN
    if (pieceHere && pieceHere.color === game.turn() && target !== selectedSquare) {
      selectedSquare = target;

      const sqEl = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      highlightSquare(sqEl);

      const moves = game.moves({ square: target, verbose: true });
      highlightLegalMoves(moves.map((m) => m.to));
      return;
    }

    // 3. Si haces clic en la misma pieza → deseleccionar
    if (target === selectedSquare) {
      selectedSquare = null;
      highlightSquare(null);
      clearLegalMoves();
      return;
    }

    // 4. Intentar mover
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
    highlightSquare(null);
    clearLegalMoves();
  }

  // CREAR CASILLAS

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.row = String(row);
      square.dataset.col = String(col);

      const isDark = (row + col) % 2 === 1;
      square.style.backgroundColor = isDark ? "#769656" : "#eeeed2";

      square.addEventListener("click", () => handleSquareClick(row, col));

      square.addEventListener("dragover", (e) => {
        e.preventDefault();
        square.classList.add("hover-target");
      });

      square.addEventListener("dragleave", () => {
        square.classList.remove("hover-target");
      });

      square.addEventListener("drop", (e) => {
        e.preventDefault();
        square.classList.remove("hover-target");

        if (!e.dataTransfer) return;

        /** @type {Square} */
        const from = /** @type {Square} */ (
          e.dataTransfer.getData("text/plain")
        );
        const to = coordToSquare(row, col);

        const piece = game.get(from);
        if (!piece || piece.color !== game.turn()) return;

        if (from === to) {
          selectedSquare = null;
          highlightSquare(null);
          clearLegalMoves();
          return;
        }

        const move = game.move({ from, to, promotion: "q" });
        if (!move) return;

        registerCapture(move);
        updateSingleMove(from, to, move);
        updateHistory();
        updateGameStatus();

        selectedSquare = null;
        highlightSquare(null);
        clearLegalMoves();
      });

      boardEl.appendChild(square);
    }
  }

  // INICIO

  renderBoard();
  updateGameStatus();
});
