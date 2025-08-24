import { useTranslation } from "react-i18next";

const langs = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "it", label: "Italiano" },
    { code: "fr", label: "Français" }
];

export default function LanguageSwitcher() {
    const { i18n, t } = useTranslation();

    const change = (e) => {
        const lang = e.target.value;
        i18n.changeLanguage(lang);
        try { localStorage.setItem("lang", lang); } catch { }
    };

    return (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="sr-only">{t("lang.label")}</span>
            <select aria-label={t("lang.label")} value={i18n.language} onChange={change}>
                {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
        </label>
    );
}
