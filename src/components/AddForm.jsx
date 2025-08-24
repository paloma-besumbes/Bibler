import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AddForm({ onAdd }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [status, setStatus] = useState("toread");
    const [cover, setCover] = useState("");

    const submit = (e) => {
        e.preventDefault();
        onAdd?.({ title, author, status, cover });
        setTitle(""); setAuthor(""); setCover("");
        setStatus("toread");
    };

    return (
        <form onSubmit={submit}>
            <label>
                <span>{t("addForm.fields.title")}</span>
                <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("addForm.placeholder.title")}
                />
            </label>

            <label>
                <span>{t("addForm.fields.author")}</span>
                <input
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder={t("addForm.placeholder.author")}
                />
            </label>

            <label>
                <span>{t("addForm.fields.status")}</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="toread">{t("filters.status.toread")}</option>
                    <option value="reading">{t("filters.status.reading")}</option>
                    <option value="finished">{t("filters.status.finished")}</option>
                </select>
            </label>

            <label>
                <span>{t("addForm.fields.cover")}</span>
                <input
                    type="url"
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    placeholder={t("addForm.placeholder.cover")}
                />
            </label>

            <button type="submit">{t("addForm.submit")}</button>
        </form>
    );
}
