import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ReviewEditor({
    initial = { text: "", isPublic: false },
    maxLength = 2000,
    onSave,
    onCancel,
    bookTitle = "libro"
}) {
    const { t } = useTranslation();
    const uid = useId();
    const [text, setText] = useState(initial?.text ?? "");
    const [isPublic, setIsPublic] = useState(!!initial?.isPublic);

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
            <h4 id={`${uid}-title`} className="review-title">{t("reviewText.section")}</h4>

            <label htmlFor={`${uid}-textarea`} className="sr-only">
                {t("reviewText.section")} — {bookTitle}
            </label>
            <textarea
                id={`${uid}-textarea`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={maxLength * 2}
                aria-describedby={`${uid}-help ${uid}-count`}
                placeholder={t("reviewText.placeholder")}
            />

            <div id={`${uid}-help`} className="review-help">
                {t("reviewText.help")}
            </div>

            <div className="review-toolbar">
                <label className="switch" aria-live="polite">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        aria-label={isPublic ? t("reviewText.public") : t("reviewText.private")}
                    />
                    <span className="slider" aria-hidden="true"></span>
                    <span className="switch-label">
                        {isPublic ? t("reviewText.public") : t("reviewText.private")}
                    </span>
                </label>

                <div id={`${uid}-count`} className={`char-count${tooLong ? ' error' : ''}`}>
                    {tooLong ? `${Math.abs(remaining)}` : `${remaining}`} {/* contador simple */}
                </div>

                <div className="review-actions">
                    <button type="button" className="btn secondary" onClick={onCancel}>{t("book.cancel")}</button>
                    <button type="submit" className="btn" disabled={!canSave}>{t("book.save")}</button>
                </div>
            </div>
        </form>
    );
}
