import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

function StarSVG({ active }) {
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
                d="M12 2l3.09 6.26 6.9.99-5 4.87 1.18 6.88L12 17.77 5.83 21l1.18-6.88-5-4.87 6.9-.99L12 2z"
                fill={active ? "currentColor" : "none"}
                stroke="currentColor"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** StarRating (0..10) */
export default function StarRating({ name, value = 0, onChange, label }) {
    const { t } = useTranslation();
    const uid = useId();
    const [hover, setHover] = useState(0);
    const display = hover || value;

    const aria = label ?? t("rating.label", { title: "" });

    return (
        <div className="rating-block">
            <div className="rating" role="radiogroup" aria-label={aria}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <div className="star-wrap" key={n}>
                        <input
                            className="sr-only star-input"
                            type="radio"
                            id={`${uid}-${name}-${n}`}
                            name={name}
                            value={n}
                            checked={value === n}
                            onChange={() => onChange?.(n)}
                            onFocus={() => setHover(0)}
                        />
                        <label
                            className="star"
                            htmlFor={`${uid}-${name}-${n}`}
                            data-active={display >= n}
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(0)}
                            title={`${n} / 10`}
                        >
                            <StarSVG active={display >= n} />
                        </label>
                    </div>
                ))}
            </div>
            <span className="rating-value" aria-live="polite" aria-atomic="true">
                {value ? t("rating.value", { value }) : t("rating.none")}
            </span>
        </div>
    );
}
