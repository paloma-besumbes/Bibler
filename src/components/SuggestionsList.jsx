export default function SuggestionsList({ items, activeIndex, onPick }) {
    const list = Array.isArray(items) ? items : []; // ← blindaje
    if (list.length === 0) return null;

    return (
        <div id="suggestions" className="suggestions" role="listbox">
            {list.map((it, i) => (
                <button
                    type="button"
                    className="item"
                    role="option"
                    id={`sugg-${i}`}
                    aria-selected={i === activeIndex}
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); onPick(it); }}
                >
                    <strong>{it.title}</strong>
                    {it.author ? <span className="muted"> — {it.author}</span> : null}
                </button>
            ))}
        </div>
    );
}
