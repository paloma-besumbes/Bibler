import { useState } from "react";
import StarRating from "./StarRating.jsx";
import ReviewEditor from "./ReviewEditor.jsx";

const placeholderCover = "https://placehold.co/400x600?text=Sin+portada";
const statusLabel = (s) => (s === "reading" ? "Leyendo" : s === "finished" ? "Terminado" : "Por leer");

export default function BookCard({ book = {}, onDelete, onCycleStatus, onEdit }) {
    const {
        id = 0,
        title = "Sin título",
        author = "Autor desconocido",
        status = "toread",
        cover = placeholderCover,
        rating = 0,
        review = null,           // { text, isPublic, updatedAt } | null
    } = book;

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ title, author, status, cover });

    // reseña
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const hasReview = !!(review && review.text && review.text.trim().length);
    const [showFull, setShowFull] = useState(false);

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
        onEdit?.(id, { rating: val }, title);
    };

    const saveReview = (newReview) => {
        onEdit?.(id, { review: newReview }, title);
        setIsReviewOpen(false);
        setShowFull(true); // acabas de guardar: muestra completa
    };

    const reviewText = (review?.text ?? "").trim();
    const isLong = reviewText.length > 220;
    const displayText = (!hasReview) ? "" : (showFull || !isLong) ? reviewText : (reviewText.slice(0, 220) + "…");

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

                        {/* Rating 10★ */}
                        <StarRating
                            name={`rating-${id}`}
                            value={rating || 0}
                            onChange={onRate}
                            label={`Puntuación para ${title}`}
                        />

                        {/* Estado */}
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

                        {/* Reseña */}
                        <div className="review-section">
                            {!hasReview && !isReviewOpen && (
                                <button className="btn tiny" onClick={() => setIsReviewOpen(true)}>
                                    Añadir reseña
                                </button>
                            )}

                            {hasReview && !isReviewOpen && (
                                <>
                                    <div className="review-meta">
                                        <span className={`badge ${review.isPublic ? 'public' : 'private'}`}>
                                            {review.isPublic ? "Pública" : "Privada"}
                                        </span>
                                        {review.updatedAt ? (
                                            <time dateTime={new Date(review.updatedAt).toISOString()}>
                                                · {new Date(review.updatedAt).toLocaleDateString()}
                                            </time>
                                        ) : null}
                                    </div>

                                    <p className="review-text">{displayText || "—"}</p>

                                    <div className="review-controls">
                                        {isLong && (
                                            <button
                                                className="btn-link"
                                                onClick={() => setShowFull(v => !v)}
                                                aria-expanded={showFull}
                                                aria-controls={`review-full-${id}`}
                                            >
                                                {showFull ? "Ver menos" : "Ver completa"}
                                            </button>
                                        )}
                                        <button className="btn tiny" onClick={() => setIsReviewOpen(true)}>
                                            Editar reseña
                                        </button>
                                    </div>
                                </>
                            )}

                            {isReviewOpen && (
                                <ReviewEditor
                                    initial={review ?? { text: "", isPublic: false }}
                                    onSave={saveReview}
                                    onCancel={() => setIsReviewOpen(false)}
                                    bookTitle={title}
                                />
                            )}
                        </div>
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
