import { useState, useEffect, useRef, useCallback } from "react";

const EMOJIS = ["🍕", "🎈", "🚀", "🐱", "🌈", "⚽", "🎸", "🍩"];
const BEST_KEY = "att_game_memory_best";

// Fisher-Yates shuffle. Math.random IS available in the browser.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck() {
  const pairs = EMOJIS.concat(EMOJIS).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
  return shuffle(pairs);
}

export default function MemoryMatch() {
  const [cards, setCards] = useState(makeDeck);
  const [selected, setSelected] = useState([]); // indices of currently face-up unmatched cards
  const [moves, setMoves] = useState(0);
  const [pairs, setPairs] = useState(0);
  const [locked, setLocked] = useState(false); // true while a non-matching pair resolves
  const [best, setBest] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const timerRef = useRef(null);

  // Load best from localStorage once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw != null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) setBest(n);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Clean up any pending flip-back timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const won = pairs === EMOJIS.length;

  // When the game is won, persist a new best (fewest moves).
  useEffect(() => {
    if (!won) return;
    setBest((prevBest) => {
      if (prevBest == null || moves < prevBest) {
        setIsNewBest(true);
        try {
          localStorage.setItem(BEST_KEY, String(moves));
        } catch {
          /* ignore storage errors */
        }
        return moves;
      }
      return prevBest;
    });
  }, [won, moves]);

  const newGame = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCards(makeDeck());
    setSelected([]);
    setMoves(0);
    setPairs(0);
    setLocked(false);
    setIsNewBest(false);
  }, []);

  const handleClick = (index) => {
    if (locked) return;
    const card = cards[index];
    if (card.flipped || card.matched) return;
    if (selected.length >= 2) return;

    const nextCards = cards.slice();
    nextCards[index] = { ...card, flipped: true };
    const nextSelected = [...selected, index];
    setCards(nextCards);
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextSelected;
      if (nextCards[a].emoji === nextCards[b].emoji) {
        // Match: mark both matched, clear selection.
        const matchedCards = nextCards.slice();
        matchedCards[a] = { ...matchedCards[a], matched: true };
        matchedCards[b] = { ...matchedCards[b], matched: true };
        setCards(matchedCards);
        setSelected([]);
        setPairs((p) => p + 1);
      } else {
        // No match: lock, flip both back after ~700ms.
        setLocked(true);
        timerRef.current = setTimeout(() => {
          setCards((prev) => {
            const reset = prev.slice();
            reset[a] = { ...reset[a], flipped: false };
            reset[b] = { ...reset[b], flipped: false };
            return reset;
          });
          setSelected([]);
          setLocked(false);
          timerRef.current = null;
        }, 700);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none text-slate-100">
      <div className="flex items-center gap-4 text-sm font-semibold">
        <span>Moves: {moves}</span>
        <span>
          Pairs: {pairs}/{EMOJIS.length}
        </span>
        <span className="text-amber-300">
          Best: {best == null ? "—" : `${best} moves`}
        </span>
      </div>

      <div
        className="grid grid-cols-4 gap-2"
        style={{ gridTemplateColumns: "repeat(4, 80px)" }}
      >
        {cards.map((card, index) => {
          const faceUp = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleClick(index)}
              disabled={faceUp || locked}
              className={
                "flex items-center justify-center rounded-xl transition-all duration-150 " +
                (faceUp
                  ? "bg-slate-100 text-slate-900 shadow-inner"
                  : "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-500 hover:from-slate-600 hover:to-slate-800 cursor-pointer") +
                (card.matched ? " ring-2 ring-amber-400" : "")
              }
              style={{ width: 80, height: 80, fontSize: faceUp ? 36 : 28 }}
            >
              {faceUp ? card.emoji : "?"}
            </button>
          );
        })}
      </div>

      <div className="h-6 text-center text-sm font-semibold">
        {won && (
          <span className="text-amber-300">
            You matched them all in {moves} moves!
            {isNewBest ? " New best!" : ""}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={newGame}
        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-sm font-bold hover:bg-amber-300"
      >
        New game
      </button>
    </div>
  );
}
