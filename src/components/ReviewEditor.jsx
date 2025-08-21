import { useEffect, useId, useState } from "react";

export default function ReviewEditor({
    initial = { text: "", isPublic: false },
    maxLength = 25000,
    onSave,
    onCancel,
    bookTitle = "libro"
}) {
    const uid = useId();
    const [text, setText] = useState(initial?.text ?? "");
    const [isPublic, setIsPublic] = useState(!!initial?.isPublic);

    // si cambia la reseña inicial (p.ej. al cambiar de tarjeta), sincroniza
    useEffect(() => {
        setText(initial?.text ?? "");
        setIsPublic(!!initial?.isPublic);
    }, [initial?.text, initial?.isPublic]);

    const remaining = maxLength - text.length;
    const tooLong = remaining < 0;
    const canSave = text.trim().length > 0 && !tooLong;

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (!canSave) return;
        onSave?.({
            text: text.trim(),
            isPublic,
            updatedAt: Date.now()
        });
    };

    return (
        <form className="review-editor" onSubmit={handleSubmit} aria-labelledby={`${uid}-title`}>
            <h4 id={`${uid}-title`} className="review-title">Reseña</h4>

            <label htmlFor={`${uid}-textarea`} className="sr-only">Escribe tu reseña para {bookTitle}</label>
            <textarea
                id={`${uid}-textarea`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={maxLength * 2}  // permitimos escribir de más para mostrar "te pasaste"
                aria-describedby={`${uid}-help ${uid}-count`}
                placeholder="Qué te ha parecido el libro…"
            />

            <div id={`${uid}-help`} className="review-help">
                Puedes publicarla para que otros la lean, o dejarla privada como diario de lectura.
            </div>

            <div className="review-toolbar">
                <label className="switch" aria-live="polite">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        aria-label={`Hacer reseña ${isPublic ? 'privada' : 'pública'}`}
                    />
                    <span className="slider" aria-hidden="true"></span>
                    <span className="switch-label">{isPublic ? "Pública" : "Privada"}</span>
                </label>

                <div id={`${uid}-count`} className={`char-count${tooLong ? ' error' : ''}`}>
                    {tooLong ? `Te has pasado por ${Math.abs(remaining)} caracteres` : `${remaining} caracteres restantes`}
                </div>

                <div className="review-actions">
                    <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
                    <button type="submit" className="btn" disabled={!canSave}>Guardar</button>
                </div>
            </div>
        </form>
    );
}
