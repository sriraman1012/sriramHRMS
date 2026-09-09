import { useRef, useEffect, useState, useCallback } from "react";

const CELL = 18;
const GRID = 20;
const SIZE = CELL * GRID; // 360
const BASE_SPEED = 110;
const BEST_KEY = "att_game_snake_best";

function randInt(n) {
  return Math.floor(Math.random() * n);
}

export default function Snake() {
  const canvasRef = useRef(null);
  const loopRef = useRef(null);

  // Mutable game state kept in a ref so the loop closure stays stable.
  const stateRef = useRef(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const v = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
    return Number.isFinite(v) ? v : 0;
  });
  const [over, setOver] = useState(false);

  const spawnFood = useCallback((snake) => {
    const occupied = new Set(snake.map((s) => s.x + "," + s.y));
    let food;
    // Fallback safety cap to avoid infinite loops when the board is nearly full.
    for (let tries = 0; tries < 1000; tries++) {
      const cand = { x: randInt(GRID), y: randInt(GRID) };
      if (!occupied.has(cand.x + "," + cand.y)) {
        food = cand;
        break;
      }
    }
    return food || { x: 0, y: 0 };
  }, []);

  const initGame = useCallback(() => {
    const snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    stateRef.current = {
      snake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: spawnFood(snake),
      alive: true,
      score: 0,
      speed: BASE_SPEED,
    };
    setScore(0);
    setOver(false);
  }, [spawnFood]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const st = stateRef.current;
    if (!ctx || !st) return;

    // Background
    ctx.fillStyle = "#0b0e16";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(SIZE, i * CELL + 0.5);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = "#ef4444";
    const fx = st.food.x * CELL;
    const fy = st.food.y * CELL;
    ctx.beginPath();
    ctx.arc(fx + CELL / 2, fy + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    for (let i = st.snake.length - 1; i >= 0; i--) {
      const seg = st.snake[i];
      ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
      const pad = i === 0 ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2
      );
    }

    // Game over overlay
    if (!st.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Game Over", SIZE / 2, SIZE / 2 - 12);
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText("Press Space or Restart", SIZE / 2, SIZE / 2 + 20);
    }
  }, []);

  const tick = useCallback(() => {
    const st = stateRef.current;
    if (!st || !st.alive) return;

    // Apply queued direction (prevents 180° reversal within a single step).
    st.dir = st.nextDir;

    const head = st.snake[0];
    const nx = head.x + st.dir.x;
    const ny = head.y + st.dir.y;

    // Wall collision
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
      st.alive = false;
      finishGame();
      draw();
      return;
    }

    // Self collision (ignore the tail cell which will move away, unless growing)
    const willGrow = nx === st.food.x && ny === st.food.y;
    const body = willGrow ? st.snake : st.snake.slice(0, -1);
    for (const seg of body) {
      if (seg.x === nx && seg.y === ny) {
        st.alive = false;
        finishGame();
        draw();
        return;
      }
    }

    st.snake.unshift({ x: nx, y: ny });

    if (willGrow) {
      st.score += 10;
      setScore(st.score);
      st.food = spawnFood(st.snake);
      // Slight speed-up as the snake grows.
      const newSpeed = Math.max(60, BASE_SPEED - Math.floor(st.score / 50) * 6);
      if (newSpeed !== st.speed) {
        st.speed = newSpeed;
        restartLoop();
      }
    } else {
      st.snake.pop();
    }

    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw, spawnFood]);

  const finishGame = useCallback(() => {
    const st = stateRef.current;
    setOver(true);
    if (st && st.score > best) {
      setBest(st.score);
      localStorage.setItem(BEST_KEY, String(st.score));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [best]);

  const restartLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    const st = stateRef.current;
    const speed = st ? st.speed : BASE_SPEED;
    loopRef.current = setInterval(() => tick(), speed);
  }, [tick]);

  const restart = useCallback(() => {
    initGame();
    draw();
    restartLoop();
  }, [initGame, draw, restartLoop]);

  // Setup + teardown
  useEffect(() => {
    initGame();
    draw();
    restartLoop();

    const setDir = (x, y) => {
      const st = stateRef.current;
      if (!st || !st.alive) return;
      // Prevent 180° reversal relative to the current committed direction.
      if (st.dir.x === -x && st.dir.y === -y) return;
      st.nextDir = { x, y };
    };

    const onKey = (e) => {
      const k = e.key;
      if (
        k === "ArrowUp" ||
        k === "ArrowDown" ||
        k === "ArrowLeft" ||
        k === "ArrowRight" ||
        k === " " ||
        k === "Spacebar"
      ) {
        e.preventDefault();
      }
      switch (k) {
        case "ArrowUp":
        case "w":
        case "W":
          setDir(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setDir(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          setDir(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setDir(1, 0);
          break;
        case " ":
        case "Spacebar": {
          const st = stateRef.current;
          if (st && !st.alive) restart();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      if (loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="flex items-center gap-6 text-sm font-semibold">
        <span>
          Score: <span className="text-amber-400">{score}</span>
        </span>
        <span>
          Best: <span className="text-amber-400">{best}</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="rounded-lg border border-white/10 bg-[#0b0e16]"
      />

      <button
        onClick={restart}
        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300"
      >
        {over ? "Restart" : "Restart"}
      </button>
    </div>
  );
}
