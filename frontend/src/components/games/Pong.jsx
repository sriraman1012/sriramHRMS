import { useEffect, useRef, useState } from "react";

const WIDTH = 480;
const HEIGHT = 320;
const PADDLE_W = 10;
const PADDLE_H = 62;
const PADDLE_MARGIN = 16;
const BALL_R = 6;
const WIN_SCORE = 5;
const PLAYER_SPEED = 6;
const AI_MAX_SPEED = 4.2;
const BASE_BALL_SPEED = 4.2;
const MAX_BALL_SPEED = 9;
const BEST_KEY = "att_game_pong_best";

export default function Pong() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({ up: false, down: false });
  const mouseYRef = useRef(null);

  const [scores, setScores] = useState({ player: 0, cpu: 0 });
  const [best, setBest] = useState(() => {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  });
  const [winner, setWinner] = useState(null); // "player" | "cpu" | null
  const [restartToken, setRestartToken] = useState(0);

  // Create a fresh game state on each (re)start.
  useEffect(() => {
    const initBall = (dir) => {
      const angle = (Math.random() * 0.6 - 0.3); // small vertical component
      const speed = BASE_BALL_SPEED;
      return {
        x: WIDTH / 2,
        y: HEIGHT / 2,
        vx: Math.cos(angle) * speed * dir,
        vy: Math.sin(angle) * speed,
        speed,
      };
    };

    const game = {
      playerY: HEIGHT / 2 - PADDLE_H / 2,
      cpuY: HEIGHT / 2 - PADDLE_H / 2,
      ball: initBall(Math.random() < 0.5 ? -1 : 1),
      player: 0,
      cpu: 0,
      rally: 0, // paddle hits this point
      bestRally: 0,
      over: false,
      serveDelay: 40, // frames pause before ball moves after a point
      initBall,
    };
    stateRef.current = game;
    keysRef.current.up = false;
    keysRef.current.down = false;
    mouseYRef.current = null;
    setScores({ player: 0, cpu: 0 });
    setWinner(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

    const resetPoint = (g, scoredBy) => {
      // scoredBy: "player" or "cpu" -> serve toward the loser
      const dir = scoredBy === "player" ? -1 : 1;
      g.ball = g.initBall(dir);
      g.serveDelay = 40;
      if (g.rally > g.bestRally) g.bestRally = g.rally;
      g.rally = 0;
    };

    const step = () => {
      const g = stateRef.current;
      if (!g) return;

      // --- Player paddle input ---
      if (mouseYRef.current != null) {
        // Center the paddle on the mouse Y.
        g.playerY = clamp(mouseYRef.current - PADDLE_H / 2, 0, HEIGHT - PADDLE_H);
      }
      if (keysRef.current.up) g.playerY -= PLAYER_SPEED;
      if (keysRef.current.down) g.playerY += PLAYER_SPEED;
      g.playerY = clamp(g.playerY, 0, HEIGHT - PADDLE_H);

      if (!g.over) {
        // --- AI paddle: track ball with capped speed ---
        const cpuCenter = g.cpuY + PADDLE_H / 2;
        const target = g.ball.y;
        const diff = target - cpuCenter;
        const move = clamp(diff, -AI_MAX_SPEED, AI_MAX_SPEED);
        g.cpuY = clamp(g.cpuY + move, 0, HEIGHT - PADDLE_H);

        // --- Ball movement ---
        if (g.serveDelay > 0) {
          g.serveDelay -= 1;
        } else {
          const b = g.ball;
          b.x += b.vx;
          b.y += b.vy;

          // Top / bottom walls
          if (b.y - BALL_R <= 0) {
            b.y = BALL_R;
            b.vy = Math.abs(b.vy);
          } else if (b.y + BALL_R >= HEIGHT) {
            b.y = HEIGHT - BALL_R;
            b.vy = -Math.abs(b.vy);
          }

          // Player paddle (left)
          const px = PADDLE_MARGIN + PADDLE_W;
          if (
            b.vx < 0 &&
            b.x - BALL_R <= px &&
            b.x - BALL_R >= PADDLE_MARGIN - 4 &&
            b.y >= g.playerY &&
            b.y <= g.playerY + PADDLE_H
          ) {
            b.x = px + BALL_R;
            bounce(b, g.playerY, 1);
            g.rally += 1;
          }

          // CPU paddle (right)
          const cx = WIDTH - PADDLE_MARGIN - PADDLE_W;
          if (
            b.vx > 0 &&
            b.x + BALL_R >= cx &&
            b.x + BALL_R <= WIDTH - PADDLE_MARGIN + 4 &&
            b.y >= g.cpuY &&
            b.y <= g.cpuY + PADDLE_H
          ) {
            b.x = cx - BALL_R;
            bounce(b, g.cpuY, -1);
            g.rally += 1;
          }

          // Scoring
          if (b.x + BALL_R < 0) {
            g.cpu += 1;
            setScores({ player: g.player, cpu: g.cpu });
            if (g.cpu >= WIN_SCORE) finish(g, "cpu");
            else resetPoint(g, "cpu");
          } else if (b.x - BALL_R > WIDTH) {
            g.player += 1;
            setScores({ player: g.player, cpu: g.cpu });
            if (g.player >= WIN_SCORE) finish(g, "player");
            else resetPoint(g, "player");
          }
        }
      }

      draw(ctx, g);
      rafRef.current = requestAnimationFrame(step);
    };

    const bounce = (b, paddleY, dir) => {
      // dir: +1 ball now moves right, -1 ball now moves left
      const rel = (b.y - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2); // -1..1
      const clamped = clamp(rel, -1, 1);
      const maxAngle = (Math.PI * 5) / 12; // 75 degrees
      const angle = clamped * maxAngle;
      b.speed = Math.min(b.speed + 0.35, MAX_BALL_SPEED);
      b.vx = Math.cos(angle) * b.speed * dir;
      b.vy = Math.sin(angle) * b.speed;
    };

    const finish = (g, who) => {
      g.over = true;
      if (g.rally > g.bestRally) g.bestRally = g.rally;
      setWinner(who);
      setBest((prevBest) => {
        const candidate = Math.max(g.bestRally, prevBest);
        if (candidate > prevBest) {
          localStorage.setItem(BEST_KEY, String(candidate));
          return candidate;
        }
        return prevBest;
      });
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [restartToken]);

  // Keyboard + mouse listeners.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        keysRef.current.up = true;
        mouseYRef.current = null; // keyboard takes over
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        keysRef.current.down = true;
        mouseYRef.current = null;
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      if (e.key === "ArrowUp") keysRef.current.up = false;
      else if (e.key === "ArrowDown") keysRef.current.down = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = HEIGHT / rect.height;
    mouseYRef.current = (e.clientY - rect.top) * scaleY;
  };

  const restart = () => setRestartToken((t) => t + 1);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="flex items-center gap-6 text-sm">
        <div className="font-mono">
          <span className="text-amber-300 font-bold">You {scores.player}</span>
          <span className="mx-2 text-white/40">vs</span>
          <span className="font-bold">{scores.cpu} CPU</span>
        </div>
        <div className="text-white/60">
          Best rally: <span className="font-bold text-slate-100">{best}</span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onMouseMove={onMouseMove}
          className="rounded-lg border border-white/10 bg-[#0b0e16]"
        />
        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/60">
            <div className="text-2xl font-bold">
              {winner === "player" ? "You win!" : "You lose!"}
            </div>
            <button
              onClick={restart}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300"
            >
              Restart
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-white/50">
          Move: mouse or Up/Down. First to {WIN_SCORE} wins.
        </span>
        <button
          onClick={restart}
          className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

function draw(ctx, g) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Center dashed line
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Paddles (light)
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(PADDLE_MARGIN, g.playerY, PADDLE_W, PADDLE_H);
  ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_W, g.cpuY, PADDLE_W, PADDLE_H);

  // Ball (white)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(g.ball.x, g.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
}
