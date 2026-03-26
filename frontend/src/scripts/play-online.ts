import { type Square, type Color, type PieceSymbol } from "chess.js";

interface Piece { color: Color; type: PieceSymbol; }
interface GameState { board: Array<Array<Piece | null>>; history: string[]; status: string; turn: Color; }

window.addEventListener("load", () => {
  const boardEl = document.getElementById("board") as HTMLElement;
  const statusEl = document.getElementById("game-status") as HTMLElement;
  const moveBody = document.getElementById("move-body") as HTMLTableSectionElement;
  
  // URL de tu servidor WebSocket
  const socket = new WebSocket("ws://localhost:3000");
  
  let selectedSquare: Square | null = null;
  const moveSound = new Audio("/sounds/move_sound.mp3");
  const captureSound = new Audio("/sounds/capture_sound.mp3");

  function getPieceImage(piece: Piece) {
    const colorFolder = piece.color === "w" ? "white" : "black";
    const map: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
    return `/pieces/${colorFolder[0]}_${map[piece.type]}.svg`;
  }

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "state") renderState(msg.payload);
    if (msg.type === "move_sound") msg.captured ? captureSound.play().catch(()=>0) : moveSound.play().catch(()=>0);
  };

  function renderState(state: GameState) {
    boardEl.innerHTML = "";
    state.board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        const square = document.createElement("div");
        const coord = (String.fromCharCode(97 + colIndex) + (8 - rowIndex)) as Square;
        square.className = `square ${(rowIndex + colIndex) % 2 === 1 ? "dark" : "light"}`;
        
        if (selectedSquare === coord) square.classList.add("selected");

        if (piece) {
          const img = document.createElement("img");
          img.src = getPieceImage(piece);
          img.className = "piece";
          // Solo permitir drag si es el turno
          img.draggable = piece.color === state.turn;
          img.addEventListener("dragstart", (e) => {
            e.dataTransfer?.setData("text/plain", coord);
            selectedSquare = coord;
          });
          square.appendChild(img);
        }

        square.onclick = () => {
          if (!selectedSquare) {
            if (piece && piece.color === state.turn) {
                selectedSquare = coord;
                renderState(state); 
            }
          } else {
            sendMove(selectedSquare, coord);
            selectedSquare = null;
          }
        };

        square.addEventListener("dragover", (e) => e.preventDefault());
        square.addEventListener("drop", (e) => {
          e.preventDefault();
          const from = e.dataTransfer?.getData("text/plain") as Square;
          if (from) sendMove(from, coord);
          selectedSquare = null;
        });
        boardEl.appendChild(square);
      });
    });
    updateUI(state);
  }

  function sendMove(from: Square, to: Square) {
    socket.send(JSON.stringify({ type: "move", payload: { from, to, promotion: "q" } }));
  }

  function updateUI(state: GameState) {
    statusEl.textContent = state.status;
    moveBody.innerHTML = "";
    for (let i = 0; i < state.history.length; i += 2) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="color:#666; width:30px">${Math.floor(i / 2) + 1}.</td>
        <td style="font-weight:bold; color:#d4af37">${state.history[i]}</td>
        <td style="color:#ccc">${state.history[i + 1] || ""}</td>
      `;
      moveBody.appendChild(tr);
    }
    const scroll = moveBody.closest(".history-scroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }
});