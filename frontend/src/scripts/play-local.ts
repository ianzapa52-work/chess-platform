import { Chess, type Square, type Move as ChessMove, type Color, type PieceSymbol } from "chess.js";

window.addEventListener("load", () => {
    const boardEl = document.getElementById("board") as HTMLElement;
    const statusEl = document.getElementById("game-status") as HTMLElement;
    const moveBody = document.getElementById("move-body") as HTMLTableSectionElement;
    const capWhite = document.getElementById("captured-white") as HTMLElement;
    const capBlack = document.getElementById("captured-black") as HTMLElement;
    const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;

    if (!boardEl) return;

    const game = new Chess();
    let selectedSquare: Square | null = null;

    // Sonidos
    const moveSound = new Audio("/sounds/move_sound.mp3");
    const captureSound = new Audio("/sounds/capture_sound.mp3");

    function getPieceImage(piece: { color: Color; type: PieceSymbol }) {
        const colorFolder = piece.color === "w" ? "white" : "black";
        const pieceMap: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
        return `/pieces/${colorFolder[0]}_${pieceMap[piece.type]}.svg`;
    }

    // CREACIÓN ÚNICA DEL TABLERO (Evita parpadeos)
    function createBoard() {
        boardEl.innerHTML = "";
        for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const square = document.createElement("div");
            const coord = (String.fromCharCode(97 + col) + (8 - row)) as Square;
            
            square.className = `square ${(row + col) % 2 === 1 ? "dark" : "light"}`;
            square.dataset.coord = coord;

            // Eventos de Drag & Drop
            square.addEventListener("dragover", (e) => e.preventDefault());
            square.addEventListener("drop", (e) => {
                e.preventDefault();
                const from = e.dataTransfer?.getData("text/plain") as Square;
                if (from) executeMove(from, coord);
            });

            square.onclick = () => handleSquareClick(coord);
            boardEl.appendChild(square);
        }
        updateBoardPieces();
    }

    // ACTUALIZACIÓN INTELIGENTE (Solo piezas y estados)
    function updateBoardPieces() {
        const state = game.board();
        const squares = boardEl.querySelectorAll(".square");

        squares.forEach((sq, i) => {
            const squareEl = sq as HTMLElement;
            const row = Math.floor(i / 8);
            const col = i % 8;
            const piece = state[row][col];
            const coord = squareEl.dataset.coord as Square;

            // Limpiar clases de selección/legalidad
            squareEl.classList.remove("selected", "legal-move");
            if (selectedSquare === coord) squareEl.classList.add("selected");

            // Gestionar imagen de la pieza sin destruir el div
            let img = squareEl.querySelector("img");
            if (piece) {
                if (!img) {
                    img = document.createElement("img");
                    img.className = "piece";
                    squareEl.appendChild(img);
                }
                const newSrc = getPieceImage(piece);
                if (img.getAttribute("src") !== newSrc) img.src = newSrc;
                
                // Solo dejar arrastrar si es su turno
                img.draggable = piece.color === game.turn();
                img.ondragstart = (e) => {
                    e.dataTransfer?.setData("text/plain", coord);
                    selectedSquare = coord;
                    highlightLegalMoves(coord);
                };
            } else if (img) {
                img.remove();
            }
        });
    }

    function highlightLegalMoves(square: Square) {
        // Primero limpiamos previos sin resetear todo
        boardEl.querySelectorAll(".square").forEach(s => s.classList.remove("legal-move"));
        
        const moves = game.moves({ square, verbose: true });
        moves.forEach(m => {
            const target = boardEl.querySelector(`[data-coord="${m.to}"]`);
            target?.classList.add("legal-move");
        });
    }

    function handleSquareClick(coord: Square) {
        const piece = game.get(coord);
        if (!selectedSquare) {
            if (piece && piece.color === game.turn()) {
                selectedSquare = coord;
                highlightLegalMoves(coord);
                boardEl.querySelector(`[data-coord="${coord}"]`)?.classList.add("selected");
            }
        } else {
            executeMove(selectedSquare, coord);
        }
    }

    function executeMove(from: Square, to: Square) {
        try {
            const move = game.move({ from, to, promotion: "q" });
            if (move) {
                move.captured ? captureSound.play().catch(()=>null) : moveSound.play().catch(()=>null);
                if (move.captured) addCaptured(move);
                updateUI();
            }
        } catch (e) { /* Movimiento inválido */ }
        selectedSquare = null;
        updateBoardPieces();
    }

    function addCaptured(move: ChessMove) {
        const container = move.color === "w" ? capWhite : capBlack;
        const img = document.createElement("img");
        const map: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
        const colorChar = move.color === "w" ? "b" : "w"; 
        img.src = `/pieces/${colorChar}_${map[move.captured!]}.svg`;
        img.style.width = "20px";
        img.style.filter = "drop-shadow(0 2px 2px rgba(0,0,0,0.5))";
        container.appendChild(img);
    }

    function updateUI() {
        // Estatus del juego
        let statusText = game.turn() === "w" ? "TURNO BLANCAS" : "TURNO NEGRAS";
        if (game.inCheck()) statusText += " (¡JAQUE!)";
        if (game.isCheckmate()) statusText = "¡JAQUE MATE!";
        if (game.isDraw()) statusText = "TABLAS";
        statusEl.textContent = statusText;

        // Historial de movimientos
        const history = game.history();
        moveBody.innerHTML = "";
        for (let i = 0; i < history.length; i += 2) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="color:#666; width: 30px;">${Math.floor(i / 2) + 1}.</td>
                <td style="font-weight:bold; color:#d4af37">${history[i]}</td>
                <td style="color:#ccc">${history[i + 1] || "-"}</td>
            `;
            moveBody.appendChild(tr);
        }
        
        // Auto-scroll al final del historial
        const scroll = moveBody.parentElement?.parentElement;
        if (scroll) scroll.scrollTop = scroll.scrollHeight;
    }

    resetBtn.onclick = () => {
        game.reset();
        capWhite.innerHTML = "";
        capBlack.innerHTML = "";
        updateUI();
        updateBoardPieces();
    };

    createBoard();
});