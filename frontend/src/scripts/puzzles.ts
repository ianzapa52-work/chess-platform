import { Chess, type Square } from "chess.js";

window.addEventListener("load", () => {
    const boardEl = document.getElementById("board") as HTMLElement;
    const feedbackEl = document.getElementById("puzzle-feedback") as HTMLElement;
    const objectiveEl = document.getElementById("puzzleObjective") as HTMLElement;
    const nextBtn = document.getElementById("nextPuzzle") as HTMLButtonElement;
    
    if (!boardEl) return;

    const game = new Chess();
    let currentIndex = 0;
    let selectedSquare: Square | null = null;

    const puzzles = [
        { id: "p1", fen: "4kb1r/p2n1ppp/4q3/4p3/3P4/8/PP1P1PPP/RNB1KBNR w KQk - 0 1", solution: "d4e5", objective: "Blancas ganan material" },
        { id: "p2", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution: "f3e5", objective: "Ataque táctico" },
        { id: "p3", fen: "6k1/pp3p1p/6p1/8/8/1P6/P1P2PPP/3R2K1 w - - 0 1", solution: "d1d8", objective: "Mate en 1" }
    ];

    function createBoard() {
        boardEl.innerHTML = "";
        for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const coord = (String.fromCharCode(97 + col) + (8 - row)) as Square;
            const square = document.createElement("div");
            square.className = `square ${(row + col) % 2 === 1 ? "dark" : "light"}`;
            square.dataset.coord = coord;

            square.addEventListener("dragover", (e) => e.preventDefault());
            square.addEventListener("drop", (e) => {
                e.preventDefault();
                const from = e.dataTransfer?.getData("text/plain") as Square;
                if (from) executePuzzleMove(from, coord);
            });

            square.onclick = () => handleSquareClick(coord);
            boardEl.appendChild(square);
        }
        updateBoardPieces();
    }

    function updateBoardPieces() {
        const state = game.board();
        const squares = boardEl.querySelectorAll(".square");
        squares.forEach((sq, i) => {
            const squareEl = sq as HTMLElement;
            const row = Math.floor(i / 8);
            const col = i % 8;
            const piece = state[row][col];
            const coord = squareEl.dataset.coord as Square;
            
            squareEl.classList.remove("selected", "legal-move");
            if (selectedSquare === coord) squareEl.classList.add("selected");

            let img = squareEl.querySelector("img");
            if (piece) {
                if (!img) {
                    img = document.createElement("img");
                    img.className = "piece";
                    squareEl.appendChild(img);
                }
                const pieceMap: Record<string, string> = { p: "pawn", r: "rook", n: "horse", b: "bishop", q: "queen", k: "king" };
                img.src = `/pieces/${piece.color}_${pieceMap[piece.type]}.svg`;
                
                img.draggable = piece.color === game.turn();
                img.ondragstart = (e) => {
                    e.dataTransfer?.setData("text/plain", coord);
                    selectedSquare = coord;
                    boardEl.querySelectorAll(".square").forEach(s => s.classList.remove("selected", "legal-move"));
                    squareEl.classList.add("selected");
                    highlightLegalMoves(coord);
                };
            } else if (img) img.remove();
        });
    }

    function handleSquareClick(coord: Square) {
        const piece = game.get(coord);
        const turn = game.turn();

        // 1. SI CLICKAS LA MISMA PIEZA QUE YA ESTÁ SELECCIONADA -> QUITAR SELECCIÓN
        if (selectedSquare === coord) {
            selectedSquare = null;
            boardEl.querySelectorAll(".square").forEach(s => s.classList.remove("selected", "legal-move"));
            return;
        }

        // 2. SI CLICKAS OTRA PIEZA DE TU COLOR -> CAMBIO FLUIDO
        if (piece && piece.color === turn) {
            selectedSquare = coord;
            boardEl.querySelectorAll(".square").forEach(s => s.classList.remove("selected", "legal-move"));
            boardEl.querySelector(`[data-coord="${coord}"]`)?.classList.add("selected");
            highlightLegalMoves(coord);
            return;
        }

        // 3. SI YA HAY UNA SELECCIONADA Y CLICKAS UN DESTINO
        if (selectedSquare) {
            executePuzzleMove(selectedSquare, coord);
        }
    }

    function highlightLegalMoves(square: Square) {
        boardEl.querySelectorAll(".square").forEach(s => s.classList.remove("legal-move"));
        const moves = game.moves({ square, verbose: true });
        moves.forEach(m => {
            boardEl.querySelector(`[data-coord="${m.to}"]`)?.classList.add("legal-move");
        });
    }

    function executePuzzleMove(from: Square, to: Square) {
        const puzzle = puzzles[currentIndex];
        
        // Limpiamos selección visual antes de procesar
        boardEl.querySelectorAll(".square").forEach(s => s.classList.remove("selected", "legal-move"));
        selectedSquare = null;

        try {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({ from, to, promotion: "q" });

            if (move) {
                // COMPROBACIÓN DE SOLUCIÓN
                if ((from + to) === puzzle.solution) {
                    // 1. Ejecutar el movimiento en el juego real
                    game.move({ from, to, promotion: "q" });
                    
                    // 2. Feedback visual inmediato en el tablero
                    feedbackEl.textContent = "¡CORRECTO!";
                    feedbackEl.style.color = "#2ecc71";
                    updateBoardPieces();
                    flashSquare(to, "success-flash", 2000);

                    // 3. Actualizar contador de puzzles resueltos en la UI
                    const solvedCountEl = document.getElementById("solved-count");
                    if (solvedCountEl) {
                        const currentScore = parseInt(solvedCountEl.textContent || "0");
                        solvedCountEl.textContent = (currentScore + 1).toString();
                    }

                    // 4. DISPARAR EVENTO PARA EL ACHIEVEMENT TOAST (La felicitación grande)
                    const solvedEvent = new CustomEvent('puzzle-solved', { 
                        detail: "¡Movimiento Maestro Encontrado!" 
                    });
                    window.dispatchEvent(solvedEvent);

                } else {
                    // MOVIMIENTO ERRÓNEO
                    game.move({ from, to, promotion: "q" });
                    updateBoardPieces();
                    
                    feedbackEl.textContent = "INTÉNTALO DE NUEVO";
                    feedbackEl.style.color = "#ec2914";

                    const duracion = 1000; 
                    flashSquare(to, "error-flash", duracion); 

                    // Revertir el movimiento después de un breve delay
                    setTimeout(() => {
                        game.undo();
                        updateBoardPieces();
                        feedbackEl.textContent = "TU TURNO";
                        feedbackEl.style.color = "white";
                    }, duracion); 
                }
            } else {
                // Movimiento no permitido por las reglas del ajedrez
                updateBoardPieces();
            }
        } catch (e) {
            console.error("Error ejecutando el movimiento:", e);
            updateBoardPieces();
        }
    }

    function flashSquare(coord: string, className: string, ms: number) {
        const sq = boardEl.querySelector(`[data-coord="${coord}"]`);
        sq?.classList.add(className);
        setTimeout(() => sq?.classList.remove(className), ms);
    }

    function loadPuzzle(idx: number) {
        currentIndex = idx;
        selectedSquare = null;
        game.load(puzzles[idx].fen);
        objectiveEl.textContent = puzzles[idx].objective;
        feedbackEl.textContent = "TU TURNO";
        feedbackEl.style.color = "white";
        updateBoardPieces();
    }

    createBoard();
    loadPuzzle(0);
    nextBtn.onclick = () => loadPuzzle((currentIndex + 1) % puzzles.length);
});