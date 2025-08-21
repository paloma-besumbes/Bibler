import { useState } from "react";
import StarRating from "./StarRating.jsx";

const placeholderCover = "https://placehold.co/400x600?text=Sin+portada";
const statusLabel = (s) => (s === "reading" ? "Leyendo" : s === "finished" ? "Terminado" : "Por leer");

export default function BookCard({ book = {}, onDelete, onCycleStatus, onEdit }) {
    // Defaults seguros
    const {
        id = 0,
        title = "Sin título",
        author = "Autor desconocido",
        status = "toread",
        cover = placeholderCover,
        rating = 0,
    } = book;

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        title,
        author,
        status,
        cover,
    });

    const onSave = () => {
        const t = form.title.trim(), a = form.author.trim();
        if (!t || !a) return;
        onEdit?.(id, {
            title: t,
            author: a,
            status: form.status,
            cover: form.cover.trim() || placeholderCover
        }, title);
        setIsEditing(false);
    };

    const onRate = (val) => {
        // Guardamos directamente al cambiar la estrella
        onEdit?.(id, { rating: val }, title);
    };

    return (
        <article className="card" data-id={id}>
            <figure className="gr-cover">
                <img
                    className="gr-cover__img"
                    src={form.cover || cover || placeholderCover}
                    alt={`Portada de ${title}`}
                    width="400" height="600"
                    loading="lazy" decoding="async"
                    onError={(e) => { e.currentTarget.src = placeholderCover; }}
                />
            </figure>

            <div className="card-body">
                {!isEditing ? (
                    <>
                        <h3>{title}</h3>
                        <p className="author">{author}</p>

                        {/* Rating 10★ (2x5) */}
                        <StarRating
                            name={`rating-${id}`}
                            value={rating || 0}
                            onChange={onRate}
                            label={`Puntuación para ${title}`}
                        />

                        <button
                            type="button"
                            className="status"
                            data-id={id}
                            data-status={status}
                            aria-label={`Estado: ${statusLabel(status)}. Pulsa para cambiar.`}
                            onClick={() => onCycleStatus?.(id, status, title)}
                        >
                            {statusLabel(status)}
                        </button>
                    </>
                ) : (
                    <div className="edit-form">
                        <label>
                            <span>Título</span>
                            <input
                                value={form.title}
                                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </label>
                        <label>
                            <span>Autor</span>
                            <input
                                value={form.author}
                                onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))}
                            />
                        </label>
                        <label>
                            <span>Estado</span>
                            <select
                                value={form.status}
                                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                            >
                                <option value="toread">Por leer</option>
                                <option value="reading">Leyendo</option>
                                <option value="finished">Terminado</option>
                            </select>
                        </label>
                        <label>
                            <span>Portada (URL)</span>
                            <input
                                type="url"
                                value={form.cover}
                                onChange={(e) => setForm(f => ({ ...f, cover: e.target.value }))}
                            />
                        </label>
                    </div>
                )}
            </div>

            <div className="actions">
                {!isEditing ? (
                    <>
                        <button className="btn-edit" onClick={() => setIsEditing(true)}>Editar</button>
                        <button
                            className="btn-delete"
                            onClick={() => onDelete?.(id, title)}
                            aria-label={`Eliminar ${title}`}
                        >
                            Eliminar
                        </button>
                    </>
                ) : (
                    <div className="edit-actions" style={{ display: "flex", gap: 8 }}>
                        <button className="btn secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                        <button className="btn" onClick={onSave}>Guardar</button>
                    </div>
                )}
            </div>
        </article>
    );
}
