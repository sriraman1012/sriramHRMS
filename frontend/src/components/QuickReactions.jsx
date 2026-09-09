// Quick-reaction bar (Uiverse by Mayurwaghgpr) — tap an emoji to send a quick chat response.
const REACTIONS = [
  { e: '👍', label: 'Like' },
  { e: '👏', label: 'Cheer' },
  { e: '🎉', label: 'Celebrate' },
  { e: '✨', label: 'Appreciate' },
  { e: '🙂', label: 'Smile' },
  { e: '❤️', label: 'Love' },
  { e: '🔥', label: 'Fire' },
]

export default function QuickReactions({ onReact }) {
  return (
    <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#e8e4df] dark:bg-[#191818] shadow-lg transition-transform duration-300 hover:scale-x-[1.03]">
      {REACTIONS.map((r) => (
        <button
          key={r.e}
          type="button"
          title={r.label}
          onClick={() => onReact(r.e)}
          className="group relative bg-white dark:bg-[#232323] rounded-full px-2 py-1 text-lg leading-none cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-125"
        >
          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] px-1.5 py-0.5 rounded-md bg-black/70 text-white dark:bg-white dark:text-black whitespace-nowrap">{r.label}</span>
          {r.e}
        </button>
      ))}
    </div>
  )
}
