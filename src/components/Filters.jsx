import { useTranslation } from "react-i18next";

export default function Filters({ q, status, sort, onChangeFilters, onChangeSort }) {
    const { t } = useTranslation();

    return (
        <div className="filters" role="group" aria-label={t("filters.sortLabel")}>
            <label htmlFor="buscador" className="sr-only">{t("filters.searchLabel")}</label>
            <input
                id="buscador"
                type="search"
                placeholder={t("filters.searchLabel")}
                aria-label={t("filters.searchLabel")}
                value={q}
                onChange={(e) => onChangeFilters({ q: e.target.value })}
            />

            <label htmlFor="estado" className="sr-only">{t("filters.statusLabel")}</label>
            <select
                id="estado"
                aria-label={t("filters.statusLabel")}
                value={status}
                onChange={(e) => onChangeFilters({ status: e.target.value })}
            >
                <option value="all">{t("filters.status.all")}</option>
                <option value="reading">{t("filters.status.reading")}</option>
                <option value="finished">{t("filters.status.finished")}</option>
                <option value="toread">{t("filters.status.toread")}</option>
            </select>

            <label htmlFor="orden" className="sr-only">{t("filters.sortLabel")}</label>
            <select
                id="orden"
                aria-label={t("filters.sortLabel")}
                value={sort}
                onChange={(e) => onChangeSort(e.target.value)}
            >
                <option value="addedAt-desc">{t("filters.sort.addedAt-desc")}</option>
                <option value="addedAt-asc">{t("filters.sort.addedAt-asc")}</option>
                <option value="rating-desc">{t("filters.sort.rating-desc")}</option>
                <option value="rating-asc">{t("filters.sort.rating-asc")}</option>
                <option value="title-asc">{t("filters.sort.title-asc")}</option>
                <option value="title-desc">{t("filters.sort.title-desc")}</option>
                <option value="author-asc">{t("filters.sort.author-asc")}</option>
                <option value="author-desc">{t("filters.sort.author-desc")}</option>
                <option value="status-asc">{t("filters.sort.status-asc")}</option>
                <option value="status-desc">{t("filters.sort.status-desc")}</option>
            </select>
        </div>
    );
}
