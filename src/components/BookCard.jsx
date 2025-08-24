import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import StarRating from "./StarRating.jsx";
import ReviewEditor from "./ReviewEditor.jsx";
import AudioRecorder from "./AudioRecorder.jsx";
import { getAudio, deleteAudio } from "../services/audioStore.js";

const placeholderCover = "https://placehold.co/400x600?text=Sin+portada";
function extFromType(type = "") {
    const t = type.toLowerCase();
    if (t.includes("webm")) return ".webm";
    if (t.includes("ogg")) return ".ogg";
    if (t.includes("mp4") || t.includes("m4a") || t.includes("aac")) return ".m4a";
    if (t.includes("mpeg") || t.includes("mp3")) return ".mp3";
    if (t.includes("wav")) return ".wav";
    return ".webm";
}
function slug(s = "") {
    return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function BookCard({ book = {}, onDelete, onCycleStatus, onEdit }) {
    const { t } = useTranslation();
    const {
        id = 0,
        title = "Sin título",
        author = "Autor desconocido",
        status = "toread",
        cover = placeholderCover,
        rating = 0,
        review = null,
        audioReview = null,
    } = book;

    const statusLabel = (s) => t(`book.status.${s}`);

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ title, author, status, cover });

    // reseña texto
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const hasReview = !!(review && review.text && review.text.trim().length);
    const [showFull, setShowFull] = useState(false);
    const reviewText = (review?.text ?? "").trim();
    const isLong = reviewText.length > 220;
    const displayText = (!hasReview) ? "" : (showFull || !isLong) ? reviewText : (reviewText.slice(0, 220) + "…");

    // audio
    const [isAudioOpen, setIsAudioOpen] = useState(false);
    const hasAudio = !!(audioReview && audioReview.audioId);
    const [audioURL, setAudioURL] = useState("");

    useEffect(() => {
        let revoke = null;
        (async () => {
            if (hasAudio) {
                const blob = await getAudio(audioReview.audioId);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    revoke = url;
                    setAudioURL(url);
                } else {
                    setAudioURL("");
                }
            } else {
                setAudioURL("");
            }
        })();
        return () => { if (revoke) URL.revokeObjectURL(revoke); };
    }, [hasAudio, audioReview?.audioId]);

    const onSave = () => {
        const tTitle = form.title.trim(), tAuthor = form.author.trim();
        if (!tTitle || !tAuthor) return;
        onEdit?.(id, {
            title: tTitle,
            author: tAuthor,
            status: form.status,
            cover: form.cover.trim() || placeholderCover
        }, title);
        setIsEditing(false);
    };

    const onRate = (val) => onEdit?.(id, { rating: val }, title);

    const saveReview = (newReview) => {
        onEdit?.(id, { review: newReview }, title);
        setIsReviewOpen(false);
        setShowFull(true);
    };

    const saveAudio = (meta) => {
        onEdit?.(id, { audioReview: meta }, title);
        setIsAudioOpen(false);
        (async () => {
            try {
                const b = await getAudio(meta.audioId);
                if (b) {
                    if (audioURL) URL.revokeObjectURL(audioURL);
                    setAudioURL(URL.createObjectURL(b));
                }
            } catch { }
        })();
    };

    const removeAudio = async () => {
        if (!hasAudio) return;
        const ok = confirm(t("reviewAudio.deleteConfirm"));
        if (!ok) return;
        try { await deleteAudio(audioReview.audioId); } catch { }
        onEdit?.(id, { audioReview: null }, title);
    };

    const downloadAudio = async () => {
        if (!hasAudio) return;
        const b = await getAudio(audioReview.audioId);
        if (!b) return alert("No se encuentra el audio en este dispositivo.");
        const ext = extFromType(b.type);
        const name = `${slug(title)}-resena${ext}`;
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
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

                        <StarRating
                            name={`rating-${id}`}
                            value={rating || 0}
                            onChange={onRate}
                            label={t("rating.label", { title })}
                        />

                        <button
                            type="button"
                            className="status"
                            data-id={id}
                            data-status={status}
                            aria-label={`${t("book.status." + status)}. ${t("book.save")}`}
                            onClick={() => onCycleStatus?.(id, status, title)}
                        >
                            {statusLabel(status)}
                        </button>

                        {/* Reseña texto */}
                        <div className="review-section">
                            {!hasReview && !isReviewOpen && (
                                <button className="btn tiny" onClick={() => setIsReviewOpen(true)}>
                                    {t("reviewText.add")}
                                </button>
                            )}

                            {hasReview && !isReviewOpen && (
                                <>
                                    <div className="review-meta">
                                        <span className={`badge ${review.isPublic ? 'public' : 'private'}`}>
                                            {review.isPublic ? t("reviewText.public") : t("reviewText.private")}
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
                                            >
                                                {showFull ? t("reviewText.seeLess") : t("reviewText.seeMore")}
                                            </button>
                                        )}
                                        <button className="btn tiny" onClick={() => setIsReviewOpen(true)}>
                                            {t("reviewText.edit")}
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

                        {/* Reseña audio */}
                        <div className="review-section">
                            {!hasAudio && !isAudioOpen && (
                                <button className="btn tiny" onClick={() => setIsAudioOpen(true)}>
                                    {t("reviewAudio.section")} — {t("reviewAudio.upload")}/{t("reviewAudio.record")}
                                </button>
                            )}

                            {hasAudio && !isAudioOpen && (
                                <>
                                    <div className="review-meta">
                                        <span className={`badge ${audioReview.isPublic ? 'public' : 'private'}`}>
                                            {audioReview.isPublic ? t("reviewText.public") : t("reviewText.private")}
                                        </span>
                                        {audioReview.durationMs ? <span>· {Math.round(audioReview.durationMs / 1000)}s</span> : null}
                                        {audioReview.updatedAt ? (
                                            <time dateTime={new Date(audioReview.updatedAt).toISOString()}>
                                                · {new Date(audioReview.updatedAt).toLocaleDateString()}
                                            </time>
                                        ) : null}
                                    </div>

                                    {audioURL ? (
                                        <audio controls src={audioURL} className="audio-player" aria-label={t("reviewAudio.playerAlt", { title })} />
                                    ) : (
                                        <p className="review-text">—</p>
                                    )}

                                    <div className="review-controls" style={{ gap: 8, flexWrap: "wrap" }}>
                                        <button className="btn tiny" onClick={downloadAudio}>{t("reviewAudio.download")}</button>
                                        <button className="btn tiny" onClick={() => setIsAudioOpen(true)}>
                                            {t("reviewText.edit")} ({t("reviewAudio.section")})
                                        </button>
                                        <button className="btn tiny danger" onClick={removeAudio}>{t("reviewAudio.delete")}</button>
                                    </div>
                                </>
                            )}

                            {isAudioOpen && (
                                <AudioRecorder
                                    initial={{
                                        isPublic: audioReview?.isPublic ?? false,
                                        audioId: audioReview?.audioId,
                                        durationMs: audioReview?.durationMs ?? 0,
                                    }}
                                    bookId={id}
                                    bookTitle={title}
                                    onSave={saveAudio}
                                    onCancel={() => setIsAudioOpen(false)}
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
                                <option value="toread">{t("book.status.toread")}</option>
                                <option value="reading">{t("book.status.reading")}</option>
                                <option value="finished">{t("book.status.finished")}</option>
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
                        <button className="btn-edit" onClick={() => setIsEditing(true)}>{t("book.edit")}</button>
                        <button
                            className="btn-delete"
                            onClick={() => onDelete?.(id, title)}
                            aria-label={`${t("book.delete")} ${title}`}
                        >
                            {t("book.delete")}
                        </button>
                    </>
                ) : (
                    <div className="edit-actions" style={{ display: "flex", gap: 8 }}>
                        <button className="btn secondary" onClick={() => setIsEditing(false)}>{t("book.cancel")}</button>
                        <button className="btn" onClick={onSave}>{t("book.save")}</button>
                    </div>
                )}
            </div>
        </article>
    );
}
