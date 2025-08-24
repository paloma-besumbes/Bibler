import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
}

/** AudioRecorder */
export default function AudioRecorder({ initial = {}, onSave, onCancel, bookId, bookTitle = "libro" }) {
    const { t } = useTranslation();
    const uid = useId();

    const mediaSupported = !!(navigator.mediaDevices && window.MediaRecorder);
    const [isPublic, setIsPublic] = useState(!!initial.isPublic);

    const [rec, setRec] = useState(null);
    const chunksRef = useRef([]);
    const startRef = useRef(0);
    const tickRef = useRef(null);

    const [elapsed, setElapsed] = useState(initial.durationMs ?? 0);
    const [blob, setBlob] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [state, setState] = useState("idle"); // idle | recording | paused | stopped

    const fileRef = useRef(null);

    useEffect(() => {
        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
            if (previewURL) URL.revokeObjectURL(previewURL);
        };
    }, [previewURL]);

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
            chunksRef.current = [];

            mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
                setBlob(b);
                const url = URL.createObjectURL(b);
                setPreviewURL((old) => { if (old) URL.revokeObjectURL(old); return url; });
                stream.getTracks().forEach(t => t.stop());
            };

            mr.start();
            setRec(mr);
            setState("recording");
            startRef.current = performance.now();
            setElapsed(0);
            tickRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 200);
        } catch (err) {
            console.error(err);
            alert(t("reviewAudio.notSupported"));
        }
    }
    function pause() { if (rec?.state === "recording") { rec.pause(); setState("paused"); if (tickRef.current) clearInterval(tickRef.current); } }
    function resume() { if (rec?.state === "paused") { rec.resume(); setState("recording"); startRef.current = performance.now() - elapsed; tickRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 200); } }
    function stop() { if (rec && (rec.state === "recording" || rec.state === "paused")) { rec.stop(); setState("stopped"); if (tickRef.current) clearInterval(tickRef.current); } }

    function pickFile() { fileRef.current?.click(); }
    function onFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewURL((old) => { if (old) URL.revokeObjectURL(old); return url; });
        setBlob(file);
        const audio = new Audio();
        audio.src = url; audio.preload = "metadata";
        audio.onloadedmetadata = () => {
            if (!isNaN(audio.duration) && audio.duration !== Infinity) {
                setElapsed(Math.round(audio.duration * 1000));
            }
        };
    }

    async function save() {
        const id = initial.audioId || `audio-${bookId}-${Date.now()}`;
        if (blob) {
            await putAudio(id, blob);
            onSave?.({ audioId: id, isPublic, durationMs: Math.round(elapsed), updatedAt: Date.now() });
            return;
        }
        if (initial.audioId) {
            onSave?.({ audioId: id, isPublic, durationMs: initial.durationMs ?? 0, updatedAt: Date.now() });
        }
    }
    const canSave = !!blob || !!initial.audioId;

    return (
        <div className="audio-recorder" aria-labelledby={`${uid}-title`}>
            <h4 id={`${uid}-title`} className="review-title">{t("reviewAudio.section")}</h4>
            {!mediaSupported && <p style={{ margin: 0 }}>{t("reviewAudio.notSupported")}</p>}

            <div className="audio-controls">
                <span className="timer" aria-live="polite">{fmt(elapsed)}</span>

                {mediaSupported && state === "idle" && <button className="btn" onClick={start}>{t("reviewAudio.record")}</button>}
                {mediaSupported && state === "recording" && (
                    <>
                        <button className="btn warning" onClick={pause}>{t("reviewAudio.pause")}</button>
                        <button className="btn danger" onClick={stop}>{t("reviewAudio.stop")}</button>
                    </>
                )}
                {mediaSupported && state === "paused" && (
                    <>
                        <button className="btn" onClick={resume}>{t("reviewAudio.resume")}</button>
                        <button className="btn danger" onClick={stop}>{t("reviewAudio.stop")}</button>
                    </>
                )}
                {mediaSupported && state === "stopped" && <button className="btn" onClick={start}>{t("reviewAudio.reRecord")}</button>}

                <button className="btn" type="button" onClick={pickFile}>{t("reviewAudio.upload")}</button>
                <input ref={fileRef} type="file" accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm" onChange={onFileChange} style={{ display: "none" }} />
            </div>

            {previewURL && (
                <audio controls src={previewURL} className="audio-player" aria-label={t("reviewAudio.previewAlt", { title: bookTitle })} />
            )}

            <label className="switch" style={{ marginTop: 10 }}>
                <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    aria-label={isPublic ? t("reviewText.public") : t("reviewText.private")}
                />
                <span className="slider" aria-hidden="true"></span>
                <span className="switch-label">{isPublic ? t("reviewText.public") : t("reviewText.private")}</span>
            </label>

            <div className="review-actions" style={{ marginTop: 12 }}>
                <button className="btn secondary" onClick={onCancel}>{t("reviewAudio.cancel")}</button>
                <button className="btn" onClick={save} disabled={!canSave}>{t("reviewAudio.save")}</button>
            </div>
        </div>
    );
}
