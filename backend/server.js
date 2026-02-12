import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// 20 puzzles aleatorios desde Chess.com
app.get("/api/puzzles", async (req, res) => {
    try {
        const puzzles = [];

        for (let i = 0; i < 20; i++) {
            const r = await fetch("https://api.chess.com/pub/puzzle");
            const json = await r.json();

            // Extraer movimientos desde el PGN
            const moves = json.pgn
                .split("\n")
                .filter(line => line && !line.startsWith("["))
                .join(" ")
                .replace(/\d+\./g, "")
                .trim()
                .split(" ")
                .join("");

            puzzles.push(
                JSON.stringify({
                    fen: json.fen,
                    moves: moves,
                    rating: json.rating || 1500
                })
            );
        }

        res.send(puzzles.join("\n"));
    } catch (err) {
        console.error("ERROR /api/puzzles:", err);
        res.status(500).json({ error: String(err) });
    }
});

// Endpoint de diagnóstico
app.get("/debug", async (req, res) => {
    try {
        const r = await fetch("https://lichess.org/api/puzzle", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/x-ndjson"
            }
        });

        const text = await r.text();

        const info = {
            status: r.status,
            statusText: r.statusText,
            headers: Object.fromEntries(r.headers.entries()),
            bodyPreview: text.slice(0, 500)
        };

        console.log("DEBUG RESPONSE:", info);

        res.json(info);
    } catch (err) {
        console.error("DEBUG ERROR:", err);
        res.status(500).json({ error: String(err) });
    }
});

app.listen(3000, "0.0.0.0", () =>
    console.log("Backend running on port 3000")
);
