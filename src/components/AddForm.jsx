import { useEffect, useRef, useState } from "react";
import SuggestionsList from "./SuggestionsList.jsx";
import { bestCover } from "../services/covers.js";

const placeholderCover = "https://placehold.co/400x600?text=Sin+portada";
const GB_KEY = import.meta.env.VITE_GOOGLE_BOOKS_KEY;

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

export default function AddForm({ onAdd, announce }) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [status, setStatus] = useState("toread");
    const [cover, setCover] = useState("");

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const abortRef = useRef(null);
    const inputRef = useRef(null);

    const fetchSuggestions = async (q) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        // Regla “palabra completa y relevante”: si todos son stopwords o <4 letras, no buscamos
        const tokens = q.trim().split(/\s+/);
        const stop = new Set(["el", "la", "los", "las", "de", "del", "the", "a", "an", "y", "o", "en", "un", "una", "the"]);
        const hasRelevant = tokens.some(t => t.length >= 4 && !stop.has(t.toLowerCase()));
        if (!hasRelevant) { setItems([]); setOpen(false); return; }

        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5`;
        const res = await fetch(url, { signal: abortRef.current.signal });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const docs = Array.isArray(data.docs) ? data.docs.slice(0, 5) : [];
        const mapped = docs.map(d => ({
            title: d.title || "",
            author: Array.isArray(d.author_name) ? d.author_name[0] : (d.author_name || ""),
            cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "",
            coverId: d.cover_i ?? null,
            isbns: Array.isArray(d.isbn) ? d.isbn.slice(0, 5) : [],
        }));

        setItems(mapped);
        setOpen(mapped.length > 0);
        setActiveIndex(-1);
        announce(`${mapped.length} sugerencias disponibles. Usa flechas y Enter.`);
    };

    const debounced = useRef(debounce(fetchSuggestions, 300)).current;

    // combobox ARIA attrs
    const comboboxProps = {
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-expanded": open,
        "aria-controls": "suggestions",
        "aria-activedescendant": activeIndex >= 0 ? `sugg-${activeIndex}` : "",
    };

    const onKeyDown = (e) => {
        if (!open || items.length === 0) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((idx) => {
                const next = e.key === "ArrowDown" ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
                return next;
            });
        }
        if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            const it = items[activeIndex];
            pick(it);
        }
        if (e.key === "Escape") {
            setOpen(false); setItems([]); setActiveIndex(-1);
        }
    };

    const pick = (it) => {
        setTitle(it.title || "");
        setAuthor(it.author || "");

        // Intento de mejor portada (Google → OL → fallback)
        (async () => {
            let finalUrl = it.cover || "";
            try {
                const best = await bestCover(
                    { title: it.title, author: it.author, isbns: it.isbns || [], coverId: it.coverId },
                    GB_KEY
                );
                if (best?.url) finalUrl = best.url;
            } catch { }
            setCover(finalUrl || placeholderCover);
        })();

        setOpen(false); setItems([]); setActiveIndex(-1);
        // mantiene el foco en el input
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        const t = title.trim(), a = author.trim();
        if (!t || !a) return;
        onAdd({
            title: t,
            author: a,
            status,
            cover: cover.trim() || placeholderCover
        });
        setTitle(""); setAuthor(""); setStatus("toread"); setCover("");
        setOpen(false); setItems([]); setActiveIndex(-1);
    };

    useEffect(() => () => abortRef.current?.abort(), []);

    return (
        <div className="form-add">
            <h3 style={{ margin: "0 0 8px" }}>Añadir libro</h3>
            <form id="form-add" autoComplete="off" onSubmit={onSubmit}>
                <label>
                    <span>Título</span>
                    <input
                        id="addTitle"
                        type="text"
                        required
                        placeholder="Ej: 1984"
                        {...comboboxProps}
                        ref={inputRef}
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); debounced(e.target.value); }}
                        onFocus={() => { if (items.length) setOpen(true); }}
                        onBlur={() => setTimeout(() => setOpen(false), 150)}
                        onKeyDown={onKeyDown}
                    />
                    {open && <SuggestionsList items={items} activeIndex={activeIndex} onPick={pick} />}
                </label>

                <label>
                    <span>Autor</span>
                    <input
                        id="addAuthor"
                        type="text"
                        required
                        placeholder="Ej: George Orwell"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                    />
                </label>

                <label>
                    <span>Estado</span>
                    <select id="addStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="toread">Por leer</option>
                        <option value="reading">Leyendo</option>
                        <option value="finished">Terminado</option>
                    </select>
                </label>

                <label>
                    <span>Portada (URL opcional)</span>
                    <input
                        id="addCover"
                        type="url"
                        placeholder="https://..."
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                    />
                </label>

                <button type="submit">Añadir</button>
            </form>
        </div>
    );
}
