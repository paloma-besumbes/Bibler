export default function Filters({ q, status, sort, onChangeFilters, onChangeSort }) {
    return (
        <div className="filters" role="group" aria-label="Filtros">
            <label htmlFor="buscador" className="sr-only">Buscar</label>
            <input
                id="buscador"
                type="search"
                placeholder="Buscar por título o autor…"
                aria-label="Buscar por título o autor"
                value={q}
                onChange={(e) => onChangeFilters({ q: e.target.value })}
            />

            <label htmlFor="estado" className="sr-only">Estado</label>
            <select
                id="estado"
                aria-label="Filtrar por estado"
                value={status}
                onChange={(e) => onChangeFilters({ status: e.target.value })}
            >
                <option value="all">Todos</option>
                <option value="reading">Leyendo</option>
                <option value="finished">Terminado</option>
                <option value="toread">Por leer</option>
            </select>

            <label htmlFor="orden" className="sr-only">Ordenar</label>
            <select
                id="orden"
                aria-label="Ordenar"
                value={sort}
                onChange={(e) => onChangeSort(e.target.value)}
            >
                {/* NUEVAS OPCIONES */}
                <option value="addedAt-desc">Añadido (reciente → antiguo)</option>
                <option value="addedAt-asc">Añadido (antiguo → reciente)</option>

                {/* Las de siempre */}
                <option value="title-asc">Título A→Z</option>
                <option value="title-desc">Título Z→A</option>
                <option value="author-asc">Autor A→Z</option>
                <option value="author-desc">Autor Z→A</option>
                <option value="status-asc">Estado (Por leer→Leyendo→Terminado)</option>
                <option value="status-desc">Estado (Terminado→Leyendo→Por leer)</option>
                <option value="rating-desc">Rating (alto → bajo)</option>
                <option value="rating-asc">Rating (bajo → alto)</option>


            </select>
        </div>
    );
}
