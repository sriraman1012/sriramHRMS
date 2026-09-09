import { useEffect, useRef, useState } from "react";

const BEST_KEY = "att_game_dino_best";

const W = 520;
const H = 220;
const GROUND_Y = 180; // y of the ground line
const GRAVITY = 0.62;
const JUMP_VELOCITY = -11.2;

export default function DinoJump() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);

  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Load best score once.
  useEffect(() => {
    let stored = 0;
    try {
      stored = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
    } catch {
      stored = 0;
    }
    setBest(stored);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Fresh game state on (re)start.
    const initState = () => ({
      player: { x: 60, y: GROUND_Y, vy: 0, size: 26, onGround: true },
      obstacles: [],
      speed: 4.4,
      distance: 0,
      score: 0,
      spawnTimer: 60,
      groundOffset: 0,
      stars: Array.from({ length: 28 }, () => ({
        x: Math.random() * W,
        y: Math.random() * (GROUND_Y - 20),
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2,
      })),
      dead: false,
      bestLocal: (() => {
        try {
          return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
        } catch {
          return 0;
        }
      })(),
      lastScoreSynced: -1,
    });

    stateRef.current = initState();
    setGameOver(false);
    setScore(0);

    const jump = () => {
      const s = stateRef.current;
      if (!s) return;
      if (s.dead) {
        restart();
        return;
      }
      if (s.player.onGround) {
        s.player.vy = JUMP_VELOCITY;
        s.player.onGround = false;
      }
    };

    const restart = () => {
      stateRef.current = initState();
      setGameOver(false);
      setScore(0);
    };

    // Expose restart to the button handler via ref-held closure.
    stateRef.current.restart = restart;
    stateRef.current.jumpFn = jump;

    const spawnObstacle = (s) => {
      // Randomize obstacle height a little.
      const tall = Math.random() < 0.35;
      const w = tall ? 16 : 20 + Math.random() * 14;
      const h = tall ? 34 + Math.random() * 12 : 20 + Math.random() * 10;
      s.obstacles.push({ x: W + 20, w, h });
    };

    const rectsOverlap = (ax, ay, aw, ah, bx, by, bw, bh) =>
      ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    const update = (s) => {
      if (s.dead) return;

      // Gradual speed ramp with distance.
      s.distance += s.speed;
      s.speed = 4.4 + s.distance / 2600;

      // Score increases with distance.
      s.score = Math.floor(s.distance / 12);

      // Player physics.
      const p = s.player;
      p.vy += GRAVITY;
      p.y += p.vy;
      if (p.y >= GROUND_Y) {
        p.y = GROUND_Y;
        p.vy = 0;
        p.onGround = true;
      }

      // Ground scroll.
      s.groundOffset = (s.groundOffset + s.speed) % 40;

      // Spawn obstacles.
      s.spawnTimer -= 1;
      if (s.spawnTimer <= 0) {
        spawnObstacle(s);
        // Spacing scales inversely with speed so it stays clearable.
        const base = 78 - Math.min(28, s.distance / 900);
        s.spawnTimer = base + Math.random() * 46;
      }

      // Move + cull obstacles, check collisions.
      const pSize = p.size;
      const px = p.x;
      const py = p.y - pSize; // top of player
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const o = s.obstacles[i];
        o.x -= s.speed;
        // Collision: shrink hitbox slightly for fairness.
        if (
          rectsOverlap(
            px + 4,
            py + 4,
            pSize - 8,
            pSize - 6,
            o.x + 2,
            GROUND_Y - o.h + 2,
            o.w - 4,
            o.h - 4
          )
        ) {
          s.dead = true;
        }
        if (o.x + o.w < -20) s.obstacles.splice(i, 1);
      }
    };

    const draw = (s, t) => {
      // Background.
      ctx.fillStyle = "#0b0e16";
      ctx.fillRect(0, 0, W, H);

      // Stars.
      for (const st of s.stars) {
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + st.tw));
        ctx.fillStyle = `rgba(226,232,240,${alpha})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant planet.
      ctx.fillStyle = "rgba(129,140,248,0.18)";
      ctx.beginPath();
      ctx.arc(430, 46, 26, 0, Math.PI * 2);
      ctx.fill();

      // Ground line.
      ctx.strokeStyle = "rgba(148,163,184,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 4);
      ctx.lineTo(W, GROUND_Y + 4);
      ctx.stroke();

      // Ground dashes (scrolling).
      ctx.strokeStyle = "rgba(148,163,184,0.28)";
      ctx.lineWidth = 2;
      for (let x = -40 + (40 - s.groundOffset); x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 12);
        ctx.lineTo(x + 16, GROUND_Y + 12);
        ctx.stroke();
      }

      // Obstacles (space rocks).
      for (const o of s.obstacles) {
        const ox = o.x;
        const oy = GROUND_Y - o.h;
        ctx.fillStyle = "#64748b";
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox, GROUND_Y);
        ctx.lineTo(ox + o.w * 0.15, oy + o.h * 0.35);
        ctx.lineTo(ox + o.w * 0.5, oy);
        ctx.lineTo(ox + o.w * 0.85, oy + o.h * 0.3);
        ctx.lineTo(ox + o.w, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Player rocket.
      const p = s.player;
      const bx = p.x;
      const by = p.y - p.size;
      ctx.save();
      ctx.translate(bx + p.size / 2, by + p.size / 2);

      // Flame (when rising).
      if (!p.onGround) {
        const flick = 4 + Math.random() * 6;
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(-4, p.size / 2 - 2);
        ctx.lineTo(4, p.size / 2 - 2);
        ctx.lineTo(0, p.size / 2 + flick);
        ctx.closePath();
        ctx.fill();
      }

      // Body.
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(p.size / 2 - 4, p.size / 2 - 4);
      ctx.lineTo(-(p.size / 2 - 4), p.size / 2 - 4);
      ctx.closePath();
      ctx.fill();

      // Window.
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Fins.
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(p.size / 2 - 4, p.size / 2 - 8);
      ctx.lineTo(p.size / 2, p.size / 2 - 2);
      ctx.lineTo(p.size / 2 - 8, p.size / 2 - 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-(p.size / 2 - 4), p.size / 2 - 8);
      ctx.lineTo(-(p.size / 2), p.size / 2 - 2);
      ctx.lineTo(-(p.size / 2 - 8), p.size / 2 - 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // HUD score.
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score ${s.score}`, 12, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(226,232,240,0.7)";
      ctx.fillText(`Best ${Math.max(s.bestLocal, s.score)}`, W - 12, 22);

      // Game over overlay.
      if (s.dead) {
        ctx.fillStyle = "rgba(11,14,22,0.78)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 8);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "13px monospace";
        ctx.fillText(
          "Press Space / click to restart",
          W / 2,
          H / 2 + 18
        );
      }
    };

    const loop = (t) => {
      const s = stateRef.current;
      if (!s) return;

      const wasDead = s.dead;
      update(s);

      // Sync React state occasionally (score + game over transitions).
      if (s.score !== s.lastScoreSynced) {
        s.lastScoreSynced = s.score;
        setScore(s.score);
      }
      if (s.dead && !wasDead) {
        // Persist best on death.
        const newBest = Math.max(s.bestLocal, s.score);
        if (newBest > s.bestLocal) {
          s.bestLocal = newBest;
          try {
            localStorage.setItem(BEST_KEY, String(newBest));
          } catch {
            /* ignore */
          }
        }
        setBest(newBest);
        setGameOver(true);
      }

      draw(s, t);
      rafRef.current = requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    const onCanvasPointer = (e) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("pointerdown", onCanvasPointer);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("pointerdown", onCanvasPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestart = () => {
    const s = stateRef.current;
    if (s && s.restart) s.restart();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-mono">
          Score <span className="font-bold text-amber-300">{score}</span>
        </span>
        <span className="font-mono text-slate-400">
          Best <span className="font-bold text-slate-200">{best}</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border border-white/10 bg-[#0b0e16]"
        style={{ touchAction: "none", cursor: "pointer" }}
      />

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">
          Space / Up / tap to jump{gameOver ? " — Space to restart" : ""}
        </span>
        <button
          type="button"
          onClick={handleRestart}
          className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
