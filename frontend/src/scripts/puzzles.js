// @ts-check
import { Chess } from "chess.js";

/** @typedef {import("chess.js").Square} Square */
/** @typedef {import("chess.js").Move} ChessMove */

window.addEventListener("load", () => {
    // NARROWING
    const boardMaybe = document.getElementById("puzzle-board");
    if (!(boardMaybe instanceof HTMLElement)) throw new Error("Missing #puzzle-board");
    const boardEl = boardMaybe;

    const objectiveMaybe = document.getElementById("puzzleObjective");
    if (!(objectiveMaybe instanceof HTMLElement)) throw new Error("Missing #puzzleObjective");
    const objectiveEl = objectiveMaybe;

    const nextMaybe = document.getElementById("nextPuzzle");
    if (!(nextMaybe instanceof HTMLButtonElement)) throw new Error("Missing #nextPuzzle");
    const nextBtn = nextMaybe;

    // CHESS.JS
    const game = new Chess();

    /** @type {Square | null} */
    let selectedSquare = null;

    // PUZZLES
    /** @type {number} */
    let index = 0;

    /** 
     * @type {{fen:string, solution:string, objective:string}[]} 
     */
    let puzzles = [];

    /**
     * @param {number} min
     * @param {number} max
     */
    async function loadPuzzlesByDifficulty(min, max) {
        const res = await fetch(`http://localhost:3000/api/puzzles?min=${min}&max=${max}`);
        const text = await res.text();
        const lines = text.trim().split("\n");

        puzzles = lines.map(line => {
            const p = JSON.parse(line);
            return {
                fen: p.fen,
                solution: p.moves.split(" ").join(""),
                objective: `Puzzle rating ${p.rating}`
            };
        });

        index = 0;
        loadPuzzle();
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
     * @param {Element | null} el
     */
    function highlightSquare(el) {
        const prev = boardEl.querySelector(".selected");
        if (prev) prev.classList.remove("selected");
        if (el instanceof HTMLElement) el.classList.add("selected");
    }

    function clearLegalMoves() {
        boardEl.querySelectorAll(".legal-move").forEach((sq) => {
            if (sq instanceof HTMLElement) sq.classList.remove("legal-move");
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

    // ANIMACIÓN DE ERROR
    /**
     * @param {number} row
     * @param {number} col}
     */
    function showWrongMove(row, col) {
        const sq = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!(sq instanceof HTMLElement)) return;

        sq.classList.add("wrong-move");

        setTimeout(() => {
            sq.classList.remove("wrong-move");
        }, 1000);
    }

    // ANIMACIÓN DE ACIERTO
    /**
     * @param {number} row
     * @param {number} col}
     */
    function showCorrectMove(row, col) {
        const sq = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!(sq instanceof HTMLElement)) return;

        sq.classList.add("correct-move");
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

        // limpiar origen
        fromSq.innerHTML = "";

        // poner pieza en destino
        const piece = game.get(to);
        if (piece) {
            const img = document.createElement("img");
            img.src = getPieceImage(piece);
            img.className = "piece";
            img.draggable = true;
            enableDrag(img, toRow, toCol);
            toSq.innerHTML = "";
            toSq.appendChild(img);
        }

        // restaurar pieza capturada si existe
        if (move.captured) {
            const capturedSquare = move.to; // la pieza capturada estaba en "to"
            const { row: capRow, col: capCol } = squareToCoord(capturedSquare);
            const capSq = boardEl.querySelector(`[data-row="${capRow}"][data-col="${capCol}"]`);

            if (capSq instanceof HTMLElement) {
                const restored = game.get(capturedSquare);
                if (restored) {
                    const img = document.createElement("img");
                    img.src = getPieceImage(restored);
                    img.className = "piece";
                    img.draggable = true;
                    enableDrag(img, capRow, capCol);
                    capSq.innerHTML = "";
                    capSq.appendChild(img);
                }
            }
        }
    }

    // RENDER INICIAL
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
     * @param {number} col}
     */
    function enableDrag(img, row, col) {
        img.addEventListener("dragstart", (e) => {
            if (!e.dataTransfer) return;

            /** @type {Square} */
            const from = coordToSquare(row, col);
            const piece = game.get(from);
            if (!piece) {
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

        if (!selectedSquare) {
            if (pieceHere) {
                selectedSquare = target;

                const sqEl = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                highlightSquare(sqEl);

                const moves = game.moves({ square: target, verbose: true });
                highlightLegalMoves(moves.map((m) => m.to));
            }
            return;
        }

        if (target === selectedSquare) {
            selectedSquare = null;
            highlightSquare(null);
            clearLegalMoves();
            return;
        }

        const move = game.move({
            from: selectedSquare,
            to: target,
            promotion: "q"
        });

        if (!move) {
            if (pieceHere) {
                selectedSquare = target;

                const sqEl = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                highlightSquare(sqEl);

                const moves = game.moves({ square: target, verbose: true });
                highlightLegalMoves(moves.map((m) => m.to));
            }
            return;
        }

        // Movimiento suave
        updateSingleMove(selectedSquare, target, move);

        selectedSquare = null;
        highlightSquare(null);
        clearLegalMoves();

        const played = move.from + move.to;
        const correct = puzzles[index].solution;

        if (played === correct) {
            const { row: r, col: c } = squareToCoord(target);
            showCorrectMove(r, c);
        } else {
            const { row: r, col: c } = squareToCoord(target);
            showWrongMove(r, c);

            setTimeout(() => {
                const undoMove = game.undo();
                if (undoMove) updateSingleMove(undoMove.to, undoMove.from, undoMove);
            }, 1000);
        }
    }

    // CREAR CASILLAS
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.dataset.row = String(row);
            square.dataset.col = String(col);

            const isDark = (row + col) % 2 === 1;
            square.style.backgroundColor = isDark ? "#769656" : "#eeeed2"

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

                const move = game.move({ from, to, promotion: "q" });
                if (!move) return;

                // Movimiento suave
                updateSingleMove(from, to, move);

                selectedSquare = null;
                highlightSquare(null);
                clearLegalMoves();

                const played = move.from + move.to;
                const correct = puzzles[index].solution;

                if (played === correct) {
                    const { row: r, col: c } = squareToCoord(to);
                    showCorrectMove(r, c);
                } else {
                    const { row: r, col: c } = squareToCoord(to);
                    showWrongMove(r, c);

                    setTimeout(() => {
                        const undoMove = game.undo();
                        if (undoMove) updateSingleMove(undoMove.to, undoMove.from, undoMove);
                    }, 1000);
                }
            });

            boardEl.appendChild(square);
        }
    }

    // SIGUIENTE PUZZLE
    nextBtn.addEventListener("click", () => {
        index = (index + 1) % puzzles.length;
        loadPuzzle();
    });

    // INICIO
    function loadPuzzle() {
        const p = puzzles[index];
        game.load(p.fen);
        objectiveEl.textContent = p.objective;
        selectedSquare = null;
        highlightSquare(null);
        clearLegalMoves();

        // limpiar animación verde
        boardEl.querySelectorAll(".correct-move").forEach(sq => {
            sq.classList.remove("correct-move");
        });

        // limpiar animación roja si se encontraba en activo
        boardEl.querySelectorAll(".wrong-move").forEach(sq => {
            sq.classList.remove("wrong-move");
        });

        renderBoard();
    }

    loadPuzzlesByDifficulty(1200, 1600);
});
