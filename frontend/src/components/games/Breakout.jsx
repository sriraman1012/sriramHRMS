import { useRef, useEffect, useState, useCallback } from "react";

const CANVAS_W = 380;
const CANVAS_H = 460;

const ROWS = 5;
const COLS = 7;
const BRICK_GAP = 4;
const BRICK_TOP = 50;
const BRICK_SIDE = 16;
const BRICK_H = 18;

const PADDLE_W = 72;
const PADDLE_H = 12;
const PADDLE_Y = CANVAS_H - 34;
const PADDLE_SPEED = 6;

const BALL_R = 6;
const BALL_SPEED = 4;

const ROW_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa"];

const BEST_KEY = "att_game_breakout_best";

function makeBricks() {
  const brickW =
    (CANVAS_W - BRICK_SIDE * 2 - BRICK_GAP * (COLS - 1)) / COLS;
  const bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: BRICK_SIDE + c * (brickW + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        w: brickW,
        h: BRICK_H,
        color: ROW_COLORS[r % ROW_COLORS.length],
        alive: true,
      });
    }
  }
  return bricks;
}

function resetBall() {
  return {
    x: CANVAS_W / 2,
    y: PADDLE_Y - BALL_R - 1,
    vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1) * 0.6,
    vy: -BALL_SPEED,
  };
}

export default function Breakout() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Mutable game state kept in a ref so the animation loop reads fresh values.
  const stateRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState("playing"); // "playing" | "won" | "lost"
  const [best, setBest] = useState(() => {
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem(BEST_KEY) : null;
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  const initGame = useCallback(() => {
    stateRef.current = {
      bricks: makeBricks(),
      ball: resetBall(),
      paddleX: CANVAS_W / 2 - PADDLE_W / 2,
      launched: false,
      score: 0,
      lives: 3,
      status: "playing",
    };
    setScore(0);
    setLives(3);
    setStatus("playing");
  }, []);

  const commitBest = useCallback((finalScore) => {
    setBest((prev) => {
      if (finalScore > prev) {
        try {
          window.localStorage.setItem(BEST_KEY, String(finalScore));
        } catch (e) {
          /* ignore storage errors */
        }
        return finalScore;
      }
      return prev;
    });
  }, []);

  const restart = useCallback(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    initGame();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        keysRef.current.right = true;
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        const s = stateRef.current;
        if (s) s.launched = true;
      }
    };

    const onKeyUp = (e) => {
      if (e.key === "ArrowLeft") {
        keysRef.current.left = false;
      } else if (e.key === "ArrowRight") {
        keysRef.current.right = false;
      }
    };

    const onMouseMove = (e) => {
      const s = stateRef.current;
      if (!s) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;
      s.paddleX = Math.max(0, Math.min(CANVAS_W - PADDLE_W, mx - PADDLE_W / 2));
      s.launched = true;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      const s = stateRef.current;

      // background
      ctx.fillStyle = "#0b0e16";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (!s) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // --- update ---
      if (s.status === "playing") {
        // paddle from keyboard
        if (keysRef.current.left) s.paddleX -= PADDLE_SPEED;
        if (keysRef.current.right) s.paddleX += PADDLE_SPEED;
        s.paddleX = Math.max(0, Math.min(CANVAS_W - PADDLE_W, s.paddleX));

        const ball = s.ball;

        if (!s.launched) {
          // ball sits on paddle until launch
          ball.x = s.paddleX + PADDLE_W / 2;
          ball.y = PADDLE_Y - BALL_R - 1;
        } else {
          ball.x += ball.vx;
          ball.y += ball.vy;

          // wall collisions
          if (ball.x - BALL_R < 0) {
            ball.x = BALL_R;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x + BALL_R > CANVAS_W) {
            ball.x = CANVAS_W - BALL_R;
            ball.vx = -Math.abs(ball.vx);
          }
          if (ball.y - BALL_R < 0) {
            ball.y = BALL_R;
            ball.vy = Math.abs(ball.vy);
          }

          // paddle collision
          if (
            ball.vy > 0 &&
            ball.y + BALL_R >= PADDLE_Y &&
            ball.y + BALL_R <= PADDLE_Y + PADDLE_H + Math.abs(ball.vy) &&
            ball.x >= s.paddleX &&
            ball.x <= s.paddleX + PADDLE_W
          ) {
            ball.y = PADDLE_Y - BALL_R;
            const hit = (ball.x - (s.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
            const angle = hit * (Math.PI / 3); // up to 60 deg
            const speed = Math.hypot(ball.vx, ball.vy) || BALL_SPEED;
            ball.vx = speed * Math.sin(angle);
            ball.vy = -Math.abs(speed * Math.cos(angle));
          }

          // brick collisions
          for (let i = 0; i < s.bricks.length; i++) {
            const b = s.bricks[i];
            if (!b.alive) continue;
            if (
              ball.x + BALL_R > b.x &&
              ball.x - BALL_R < b.x + b.w &&
              ball.y + BALL_R > b.y &&
              ball.y - BALL_R < b.y + b.h
            ) {
              b.alive = false;
              s.score += 10;
              setScore(s.score);

              // decide bounce axis by smallest overlap
              const overlapLeft = ball.x + BALL_R - b.x;
              const overlapRight = b.x + b.w - (ball.x - BALL_R);
              const overlapTop = ball.y + BALL_R - b.y;
              const overlapBottom = b.y + b.h - (ball.y - BALL_R);
              const minX = Math.min(overlapLeft, overlapRight);
              const minY = Math.min(overlapTop, overlapBottom);
              if (minX < minY) {
                ball.vx = -ball.vx;
              } else {
                ball.vy = -ball.vy;
              }
              break;
            }
          }

          // win check
          if (s.bricks.every((b) => !b.alive)) {
            s.status = "won";
            setStatus("won");
            commitBest(s.score);
          }

          // fell below paddle
          if (ball.y - BALL_R > CANVAS_H) {
            s.lives -= 1;
            setLives(s.lives);
            if (s.lives <= 0) {
              s.status = "lost";
              setStatus("lost");
              commitBest(s.score);
            } else {
              s.ball = resetBall();
              s.launched = false;
            }
          }
        }
      }

      // --- render ---
      // bricks
      for (let i = 0; i < s.bricks.length; i++) {
        const b = s.bricks[i];
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(b.x, b.y, b.w, 3);
      }

      // paddle
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      const r = PADDLE_H / 2;
      const px = s.paddleX;
      ctx.moveTo(px + r, PADDLE_Y);
      ctx.arcTo(px + PADDLE_W, PADDLE_Y, px + PADDLE_W, PADDLE_Y + PADDLE_H, r);
      ctx.arcTo(px + PADDLE_W, PADDLE_Y + PADDLE_H, px, PADDLE_Y + PADDLE_H, r);
      ctx.arcTo(px, PADDLE_Y + PADDLE_H, px, PADDLE_Y, r);
      ctx.arcTo(px, PADDLE_Y, px + PADDLE_W, PADDLE_Y, r);
      ctx.closePath();
      ctx.fill();

      // ball
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      // overlays
      if (s.status !== "playing") {
        ctx.fillStyle = "rgba(2,6,23,0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = s.status === "won" ? "#4ade80" : "#f87171";
        ctx.font = "bold 30px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          s.status === "won" ? "You Win!" : "Game Over",
          CANVAS_W / 2,
          CANVAS_H / 2 - 8
        );
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText(
          "Press Restart to play again",
          CANVAS_W / 2,
          CANVAS_H / 2 + 22
        );
      } else if (!s.launched) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Press Space or move mouse to launch",
          CANVAS_W / 2,
          CANVAS_H - 8
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, [initGame, commitBest]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="flex items-center gap-4 text-sm font-semibold">
        <span>
          Score: <span className="text-amber-300">{score}</span>
        </span>
        <span>
          Lives: <span className="text-rose-300">{lives}</span>
        </span>
        <span>
          Best: <span className="text-emerald-300">{best}</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-lg border border-white/10 bg-[#0b0e16]"
      />

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">
          {status === "won"
            ? "You cleared the board!"
            : status === "lost"
            ? "Out of lives."
            : "Left/Right or mouse to move"}
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
