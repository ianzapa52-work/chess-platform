import { Chess, type Square, type Color, type PieceSymbol } from "chess.js";

window.addEventListener("load", () => {
    const boardEl = document.getElementById("board") as HTMLElement;
    const objectiveEl = document.getElementById("puzzleObjective") as HTMLElement;
    const feedbackEl = document.getElementById("puzzle-feedback") as HTMLElement;
    const nextBtn = document.getElementById("nextPuzzle") as HTMLButtonElement;
    const solvedCountEl = document.getElementById("solved-count") as HTMLElement;
    const badgeEl = document.getElementById("already-done-badge") as HTMLElement;
    
    const game = new Chess();
    let currentIndex = 0;
    let selectedSquare: Square | null = null;

    // Sonidos
    const moveSound = new Audio("/sounds/move.mp3");
    const captureSound = new Audio("/sounds/capture.mp3");

    const puzzles = [
        { id: "p1", fen: "4kb1r/p2n1ppp/4q3/4p3/3P4/8/PP1P1PPP/RNB1KBNR w KQk - 0 1", solution: "d4e5", objective: "Blancas ganan material" },
        { id: "p2", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution: "f3e5", objective: "Ataque táctico" },
        { id: "p3", fen: "6k1/pp3p1p/6p1/8/8/1P6/P1P2PPP/3R2K1 w - - 0 1", solution: "d1d8", objective: "Mate en 1" }
    ];

    // Cargar estadísticas
    let stats = JSON.parse(localStorage.getItem("stats") || '{"rating":1200, "totalGames":0, "wins":0, "losses":0, "draws":0, "puzzlesSolved":0, "puzzlesFailed":0}');
    let solvedIds = JSON.parse(localStorage.getItem("solvedPuzzleIds") || "[]");

    function renderBoard() {
        boardEl.innerHTML = "";
        game.board().forEach((row, rIdx) => {
            row.forEach((piece, cIdx) => {
                const square = document.createElement("div");
                const coord = (String.fromCharCode(97 + cIdx) + (8 - rIdx)) as Square;
                square.className = `square ${(rIdx + cIdx) % 2 === 1 ? "dark" : "light"}`;
                square.dataset.coord = coord;

                if (piece) {
                    const img = document.createElement("img");
                    img.src = `/pieces/${piece.color}_${{p:'pawn',r:'rook',n:'horse',b:'bishop',q:'queen',k:'king'}[piece.type]}.svg`;
                    img.className = "piece";
                    img.draggable = true;

                    // Drag and Drop Nativo
                    img.addEventListener("dragstart", (e) => {
                        e.dataTransfer?.setData("text/plain", coord);
                        img.classList.add("dragging");
                        selectedSquare = coord;
                    });

                    img.addEventListener("dragend", () => img.classList.remove("dragging"));
                    
                    img.onclick = (e) => {
                        e.stopPropagation();
                        handleSquareSelect(coord);
                    };

                    square.appendChild(img);
                }

                square.addEventListener("dragover", (e) => e.preventDefault());
                square.addEventListener("drop", (e) => {
                    e.preventDefault();
                    const from = e.dataTransfer?.getData("text/plain") as Square;
                    if (from) executePuzzleMove(from, coord);
                });

                square.onclick = () => handleSquareSelect(coord);
                boardEl.appendChild(square);
            });
        });
        if (solvedCountEl) solvedCountEl.textContent = stats.puzzlesSolved;
    }

    function handleSquareSelect(coord: Square) {
        if (selectedSquare === coord) {
            selectedSquare = null;
            renderBoard();
            return;
        }

        if (!selectedSquare) {
            if (game.get(coord)?.color === game.turn()) {
                selectedSquare = coord;
                renderBoard();
            }
        } else {
            executePuzzleMove(selectedSquare, coord);
            selectedSquare = null;
        }
    }

    function executePuzzleMove(from: Square, to: Square) {
        const puzzle = puzzles[currentIndex];
        const isAlreadySolved = solvedIds.includes(puzzle.id);

        try {
            const move = game.move({ from, to, promotion: "q" });
            if (move) {
                const moveAttempt = from + to;
                
                if (moveAttempt === puzzle.solution) {
                    // ÉXITO
                    move.captured ? captureSound.play().catch(()=>0) : moveSound.play().catch(()=>0);
                    feedbackEl.textContent = "¡CORRECTO!";
                    feedbackEl.style.color = "#4ade80";

                    if (!isAlreadySolved) {
                        stats.puzzlesSolved++;
                        solvedIds.push(puzzle.id);
                        localStorage.setItem("stats", JSON.stringify(stats));
                        localStorage.setItem("solvedPuzzleIds", JSON.stringify(solvedIds));
                    }
                } else {
                    // ERROR
                    game.undo();
                    feedbackEl.textContent = "INTENTA DE NUEVO";
                    feedbackEl.style.color = "#f87171";
                    if (!isAlreadySolved) {
                        stats.puzzlesFailed++;
                        localStorage.setItem("stats", JSON.stringify(stats));
                    }
                    flashError(from, to);
                }
                renderBoard();
            }
        } catch (e) {
            renderBoard();
        }
    }

    function flashError(f: string, t: string) {
        const s1 = boardEl.querySelector(`[data-coord="${f}"]`);
        const s2 = boardEl.querySelector(`[data-coord="${t}"]`);
        s1?.classList.add("error-flash");
        s2?.classList.add("error-flash");
        setTimeout(() => {
            s1?.classList.remove("error-flash");
            s2?.classList.remove("error-flash");
        }, 400);
    }

    function loadPuzzle(idx: number) {
        currentIndex = idx;
        const puzzle = puzzles[idx];
        game.load(puzzle.fen);
        
        objectiveEl.textContent = puzzle.objective;
        feedbackEl.textContent = "TU TURNO";
        feedbackEl.style.color = "#d4af37";
        
        const isSolved = solvedIds.includes(puzzle.id);
        badgeEl.style.display = isSolved ? "block" : "none";
        
        renderBoard();
    }

    nextBtn.onclick = () => {
        currentIndex = (currentIndex + 1) % puzzles.length;
        loadPuzzle(currentIndex);
    };

    loadPuzzle(0);
});