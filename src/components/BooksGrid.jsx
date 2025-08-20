import BookCard from "./BookCard.jsx";

export default function BooksGrid({ books = [], onDelete, onCycleStatus, onEdit }) {
    // Blindaje: garantizamos que 'list' sea SIEMPRE un array normal.
    const list = Array.isArray(books) ? books.filter(Boolean) : [];

    // Si por lo que sea no hay lista, mostramos el vacío sin reventar:
    if (list.length === 0) {
        return (
            <div className="card" role="status" aria-live="polite" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "24px" }}>
                <p>No hay libros que coincidan con tu búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="grid" id="grid-libros">
            {list.map((b) => (
                <BookCard
                    key={b?.id ?? Math.random()}
                    book={b ?? {}}
                    onDelete={onDelete}
                    onCycleStatus={onCycleStatus}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
}
