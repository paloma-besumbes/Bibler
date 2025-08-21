import { useId, useState } from "react";

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

/**
 * StarRating (0..10)
 * Props:
 *  - name: string (grupo de radios, debe ser único por tarjeta)
 *  - value: number (0..10)
 *  - onChange: fn(newValue:number)
 *  - label: string opcional ("Tu puntuación")
 */
export default function StarRating({ name, value = 0, onChange, label = "Puntuación" }) {
    const uid = useId();
    const [hover, setHover] = useState(0); // 0 = sin hover; 1..10 = estrella “previsualizada”
    const display = hover || value;        // lo que se pinta visualmente

    return (
        <div className="rating-block">
            <div
                className="rating"
                role="radiogroup"
                aria-label={`${label}, ${value ? `${value} de 10` : "sin puntuación"}`}
            >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <div className="star-wrap" key={n}>
                        {/* Radio accesible (oculto visualmente pero enfocable) */}
                        <input
                            className="sr-only star-input"
                            type="radio"
                            id={`${uid}-${name}-${n}`}
                            name={name}
                            value={n}
                            checked={value === n}
                            onChange={() => onChange?.(n)}
                            onFocus={(e) => setHover(0)} // el foco no debe activar hover
                        />
                        {/* Label clicable / hoverable */}
                        <label
                            className="star"
                            htmlFor={`${uid}-${name}-${n}`}
                            data-active={display >= n}
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(0)}
                            title={`${n} de 10`}
                        >
                            <StarSVG active={display >= n} />
                        </label>
                    </div>
                ))}
            </div>

            {/* Valor numérico visible y anunciado (a11y) */}
            <span className="rating-value" aria-live="polite" aria-atomic="true">
                {value ? `${value}/10` : "—"}
            </span>
        </div>
    );
}
