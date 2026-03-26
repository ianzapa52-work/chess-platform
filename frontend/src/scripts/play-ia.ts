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

    const moveSound = new Audio("/sounds/move_sound.mp3");
    const captureSound = new Audio("/sounds/capture_sound.mp3");

    function getPieceImage(piece: { color: Color; type: PieceSymbol }) {
        const colorFolder = piece.color === "w" ? "white" : "black";
        const map: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
        return `/pieces/${colorFolder[0]}_${map[piece.type]}.svg`;
    }

    function createBoard() {
        boardEl.innerHTML = "";
        for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const square = document.createElement("div");
            const coord = (String.fromCharCode(97 + col) + (8 - row)) as Square;
            
            square.className = `square ${(row + col) % 2 === 1 ? "dark" : "light"}`;
            square.dataset.coord = coord;

            square.addEventListener("dragover", (e) => e.preventDefault());
            square.addEventListener("drop", (e) => {
                e.preventDefault();
                if (game.turn() !== 'w') return;
                const from = e.dataTransfer?.getData("text/plain") as Square;
                if (from) executeMove(from, coord);
            });

            square.onclick = () => { if (game.turn() === 'w') handleSquareClick(coord); };
            boardEl.appendChild(square);
        }
        updateBoardPieces();
    }

    function updateBoardPieces() {
        const state = game.board();
        const squares = boardEl.querySelectorAll(".square");

        squares.forEach((sq) => {
            const squareEl = sq as HTMLElement;
            const coord = squareEl.dataset.coord as Square;
            const pos = { row: 8 - parseInt(coord[1]), col: coord.charCodeAt(0) - 97 };
            const piece = state[pos.row][pos.col];

            // Limpieza: quitamos selected y legal-move siempre al actualizar
            squareEl.classList.remove("selected", "legal-move");
            if (selectedSquare === coord) squareEl.classList.add("selected");

            let img = squareEl.querySelector("img");
            if (piece) {
                if (!img) {
                    img = document.createElement("img");
                    img.className = "piece";
                    squareEl.appendChild(img);
                }
                img.src = getPieceImage(piece);
                img.draggable = piece.color === 'w' && game.turn() === 'w';
                img.ondragstart = (e) => {
                    if (game.turn() !== 'w') return;
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
            if (piece && piece.color === "w") {
                selectedSquare = coord;
                highlightLegalMoves(coord);
            }
        } else {
            executeMove(selectedSquare, coord);
        }
    }

    function executeMove(from: Square, to: Square) {
        try {
            const move = game.move({ from, to, promotion: "q" });
            if (move) {
                selectedSquare = null; // Quitamos la selección para que no brille la casilla origen
                move.captured ? captureSound.play().catch(()=>null) : moveSound.play().catch(()=>null);
                if (move.captured) updateCaptured(move);
                updateUI();
                updateBoardPieces();

                if (!game.isGameOver()) {
                    setTimeout(makeAIMove, 600);
                }
            }
        } catch (e) { 
            selectedSquare = null;
            updateBoardPieces(); 
        }
    }

    function makeAIMove() {
        const moves = game.moves({ verbose: true });
        if (moves.length === 0) return;
        const captureMoves = moves.filter(m => m.captured);
        const finalMove = captureMoves.length > 0 
            ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
            : moves[Math.floor(Math.random() * moves.length)];

        const move = game.move(finalMove);
        move.captured ? captureSound.play().catch(()=>null) : moveSound.play().catch(()=>null);
        if (move.captured) updateCaptured(move);
        updateUI();
        updateBoardPieces();
    }

    function updateCaptured(move: ChessMove) {
        const container = move.color === "w" ? capWhite : capBlack;
        const img = document.createElement("img");
        const map: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
        const colorChar = move.color === "w" ? "b" : "w"; 
        img.src = `/pieces/${colorChar}_${map[move.captured!]}.svg`;
        img.style.width = "28px";
        container.appendChild(img);
    }

    function updateUI() {
        statusEl.textContent = game.turn() === "w" ? "TU TURNO" : "IA PENSANDO...";
        if (game.inCheck()) statusEl.textContent += " (¡JAQUE!)";
        if (game.isCheckmate()) statusEl.textContent = "¡JAQUE MATE!";
        
        const history = game.history();
        moveBody.innerHTML = "";
        for (let i = 0; i < history.length; i += 2) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="color:#666; width:30px">${Math.floor(i/2)+1}.</td>
                <td style="font-weight:bold; color:#d4af37">${history[i]}</td>
                <td style="color:#ccc">${history[i+1] || ""}</td>
            `;
            moveBody.appendChild(tr);
        }
        const scroll = moveBody.closest(".history-scroll");
        if (scroll) scroll.scrollTop = scroll.scrollHeight;
    }

    resetBtn.onclick = () => {
        game.reset();
        capWhite.innerHTML = "";
        capBlack.innerHTML = "";
        selectedSquare = null;
        updateUI();
        updateBoardPieces();
    };

    createBoard();
});