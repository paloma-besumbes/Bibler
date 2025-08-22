import { useEffect, useId, useRef, useState } from "react";
import { putAudio, getAudio } from "../services/audioStore.js";

function fmt(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
}

function pickSupportedMime() {
    const prefs = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/webm",
        "audio/ogg",
        "audio/mp4;codecs=aac",
        "audio/mp4"
    ];
    for (const t of prefs) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
            return t;
        }
    }
    return ""; // deja que el navegador elija
}

/**
 * AudioRecorder
 * Props:
 *  - initial: { isPublic?: boolean, audioId?: string, durationMs?: number }
 *  - onSave: ({ audioId, isPublic, durationMs, updatedAt }) => void
 *  - onCancel: () => void
 *  - bookId: number|string
 *  - bookTitle: string
 */
export default function AudioRecorder({ initial = {}, onSave, onCancel, bookId, bookTitle = "libro" }) {
    const uid = useId();

    // Soporte de grabación
    const mediaSupported = !!(navigator.mediaDevices && window.MediaRecorder);
    const [isPublic, setIsPublic] = useState(!!initial.isPublic);

    // MediaRecorder
    const [rec, setRec] = useState(null);
    const [chosenMime, setChosenMime] = useState("");
    const chunksRef = useRef([]);
    const startRef = useRef(0);
    const tickRef = useRef(null);

    // Datos de audio en edición
    const [elapsed, setElapsed] = useState(initial.durationMs ?? 0);
    const [blob, setBlob] = useState(null);
    const [previewURL, setPreviewURL] = useState("");

    // UI
    const [state, setState] = useState("idle"); // idle | recording | paused | stopped

    // Subida de archivo
    const fileRef = useRef(null);

    useEffect(() => {
        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
            if (previewURL) URL.revokeObjectURL(previewURL);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cargar audio existente para pre-escucha
    useEffect(() => {
        let revoke = null;
        (async () => {
            if (initial.audioId) {
                try {
                    const b = await getAudio(initial.audioId);
                    if (b) {
                        const url = URL.createObjectURL(b);
                        revoke = url;
                        setPreviewURL(url);
                        // si no hay duración previa, la dejamos tal cual
                    }
                } catch { }
            }
        })();
        return () => { if (revoke) URL.revokeObjectURL(revoke); };
    }, [initial.audioId]);

    async function start() {
        if (!mediaSupported || state === "recording") return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const prefer = pickSupportedMime();
            const mr = prefer ? new MediaRecorder(stream, { mimeType: prefer }) : new MediaRecorder(stream);
            setChosenMime(prefer || mr.mimeType || "");
            chunksRef.current = [];

            mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
                setBlob(b);
                const url = URL.createObjectURL(b);
                setPreviewURL((old) => { if (old) URL.revokeObjectURL(old); return url; });
                // parar micro
                stream.getTracks().forEach(t => t.stop());
            };

            mr.start();
            setRec(mr);
            setState("recording");
            startRef.current = performance.now();
            setElapsed(0);
            tickRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 200);
        } catch (err) {
            console.error("Permiso de micro denegado o error:", err);
            alert("No se pudo acceder al micrófono. Revisa permisos del navegador.");
        }
    }

    function pause() {
        if (rec && rec.state === "recording") {
            rec.pause();
            setState("paused");
            if (tickRef.current) clearInterval(tickRef.current);
        }
    }

    function resume() {
        if (rec && rec.state === "paused") {
            rec.resume();
            setState("recording");
            startRef.current = performance.now() - elapsed;
            tickRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 200);
        }
    }

    function stop() {
        if (rec && (rec.state === "recording" || rec.state === "paused")) {
            rec.stop();
            setState("stopped");
            if (tickRef.current) clearInterval(tickRef.current);
        }
    }

    // Subir archivo propio
    function pickFile() { fileRef.current?.click(); }
    function onFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewURL((old) => { if (old) URL.revokeObjectURL(old); return url; });
        setBlob(file);
        // duración real si está disponible
        const audio = new Audio();
        audio.src = url;
        audio.preload = "metadata";
        audio.onloadedmetadata = () => {
            if (!isNaN(audio.duration) && audio.duration !== Infinity) {
                setElapsed(Math.round(audio.duration * 1000));
            }
        };
    }

    async function save() {
        const id = initial.audioId || `audio-${bookId}-${Date.now()}`;

        // Si hay nueva grabación o archivo subido → guardamos blob y duración
        if (blob) {
            await putAudio(id, blob);
            onSave?.({ audioId: id, isPublic, durationMs: Math.round(elapsed), updatedAt: Date.now() });
            return;
        }

        // Si no hay blob nuevo pero sí audio previo → guardamos cambios de visibilidad/fecha
        if (initial.audioId) {
            onSave?.({ audioId: id, isPublic, durationMs: initial.durationMs ?? 0, updatedAt: Date.now() });
            return;
        }
    }

    const canSave = !!blob || !!initial.audioId;

    return (
        <div className="audio-recorder" aria-labelledby={`${uid}-title`}>
            <h4 id={`${uid}-title`} className="review-title">Reseña de audio</h4>

            {!mediaSupported && (
                <p style={{ margin: 0 }}>
                    Tu navegador no soporta la grabación directa. Puedes <strong>subir un archivo</strong> desde tu dispositivo.
                </p>
            )}

            <div className="audio-controls">
                <span className="timer" aria-live="polite">{fmt(elapsed)}</span>

                {/* Controles de grabación (si hay soporte) */}
                {mediaSupported && state === "idle" && (
                    <button className="btn" onClick={start} aria-label={`Empezar a grabar reseña para ${bookTitle}`}>Grabar</button>
                )}
                {mediaSupported && state === "recording" && (
                    <>
                        <button className="btn warning" onClick={pause}>Pausar</button>
                        <button className="btn danger" onClick={stop}>Parar</button>
                    </>
                )}
                {mediaSupported && state === "paused" && (
                    <>
                        <button className="btn" onClick={resume}>Reanudar</button>
                        <button className="btn danger" onClick={stop}>Parar</button>
                    </>
                )}
                {mediaSupported && state === "stopped" && (
                    <>
                        <button className="btn" onClick={start}>Regrabar</button>
                    </>
                )}

                {/* Subida de archivo (siempre visible) */}
                <button className="btn" type="button" onClick={pickFile}>Subir archivo</button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm"
                    onChange={onFileChange}
                    style={{ display: "none" }}
                />
            </div>

            {/* Previsualización */}
            {previewURL && (
                <audio controls src={previewURL} className="audio-player" aria-label={`Previsualización de reseña de ${bookTitle}`} />
            )}

            {/* Switch pública/privada */}
            <label className="switch" style={{ marginTop: 10 }}>
                <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    aria-label={`Hacer reseña de audio ${isPublic ? 'privada' : 'pública'}`}
                />
                <span className="slider" aria-hidden="true"></span>
                <span className="switch-label">{isPublic ? "Pública" : "Privada"}</span>
            </label>

            <div className="review-actions" style={{ marginTop: 12 }}>
                <button className="btn secondary" onClick={onCancel}>Cancelar</button>
                <button className="btn" onClick={save} disabled={!canSave}>Guardar audio</button>
            </div>
        </div>
    );
}
