import { useState, useEffect, useRef, useCallback } from "react";

const SCORE_KEY = "att_game_ttt_score";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function loadScore() {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        w: Number(p.w) || 0,
        l: Number(p.l) || 0,
        d: Number(p.d) || 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { w: 0, l: 0, d: 0 };
}

function calcWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return null;
}

function findWinningMove(board, player) {
  for (const line of LINES) {
    const [a, b, c] = line;
    const vals = [board[a], board[b], board[c]];
    const emptyIdx = line[vals.indexOf(null)];
    const count = vals.filter((v) => v === player).length;
    const empties = vals.filter((v) => v === null).length;
    if (count === 2 && empties === 1) {
      return emptyIdx;
    }
  }
  return -1;
}

// Reasonably smart heuristic AI: win > block > center > corner > side.
function computerMove(board) {
  // 1. Win if possible
  let move = findWinningMove(board, "O");
  if (move !== -1) return move;

  // 2. Block human's winning move
  move = findWinningMove(board, "X");
  if (move !== -1) return move;

  // 3. Take center
  if (board[4] === null) return 4;

  // 4. Take a corner
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Any remaining cell (sides)
  const sides = [1, 3, 5, 7].filter((i) => board[i] === null);
  if (sides.length) {
    return sides[Math.floor(Math.random() * sides.length)];
  }

  return -1;
}

const emptyBoard = () => Array(9).fill(null);

export default function TicTacToe() {
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState("X"); // "X" human, "O" computer
  const [score, setScore] = useState(loadScore);
  const timerRef = useRef(null);

  const winner = calcWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);
  const gameOver = !!winner || isDraw;

  // Persist score whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(score));
    } catch {
      /* ignore */
    }
  }, [score]);

  // Record result exactly once per finished game
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!gameOver) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    setScore((s) => {
      if (winner && winner.player === "X") return { ...s, w: s.w + 1 };
      if (winner && winner.player === "O") return { ...s, l: s.l + 1 };
      return { ...s, d: s.d + 1 };
    });
  }, [gameOver, winner]);

  // Computer turn
  useEffect(() => {
    if (gameOver || turn !== "O") return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setBoard((prev) => {
        if (calcWinner(prev) || prev.every((c) => c !== null)) return prev;
        const move = computerMove(prev);
        if (move === -1) return prev;
        const next = prev.slice();
        next[move] = "O";
        return next;
      });
      setTurn("X");
    }, 350);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [turn, gameOver]);

  // Clear any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleClick = useCallback(
    (i) => {
      if (gameOver || turn !== "X" || board[i] !== null) return;
      setBoard((prev) => {
        if (prev[i] !== null) return prev;
        const next = prev.slice();
        next[i] = "X";
        return next;
      });
      setTurn("O");
    },
    [gameOver, turn, board]
  );

  const newRound = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    recordedRef.current = false;
    setBoard(emptyBoard());
    setTurn("X");
  }, []);

  let message;
  if (winner && winner.player === "X") message = "You win!";
  else if (winner && winner.player === "O") message = "Computer wins";
  else if (isDraw) message = "Draw";
  else if (turn === "X") message = "Your turn (X)";
  else message = "Computer thinking…";

  const winLine = winner ? winner.line : [];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="text-lg font-bold tracking-wide">Tic-Tac-Toe</div>

      <div className="text-sm font-semibold h-5">{message}</div>

      <div className="grid grid-cols-3 gap-1.5">
        {board.map((cell, i) => {
          const inWin = winLine.includes(i);
          const clickable = !gameOver && turn === "X" && cell === null;
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!clickable}
              className={
                "flex items-center justify-center rounded-lg text-4xl font-black transition-colors " +
                "border border-slate-700 " +
                (inWin
                  ? "bg-emerald-500/30 "
                  : "bg-slate-800 ") +
                (clickable ? "hover:bg-slate-700 cursor-pointer " : "cursor-default ") +
                (cell === "X"
                  ? "text-sky-400 "
                  : cell === "O"
                  ? "text-rose-400 "
                  : "text-slate-500 ")
              }
              style={{ width: 72, height: 72 }}
              aria-label={`Cell ${i + 1}${cell ? ", " + cell : ", empty"}`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-sm font-semibold">
        <span className="text-sky-400">W: {score.w}</span>
        <span className="text-rose-400">L: {score.l}</span>
        <span className="text-slate-300">D: {score.d}</span>
      </div>

      <button
        onClick={newRound}
        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300"
      >
        New round
      </button>
    </div>
  );
}
