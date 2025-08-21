import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import Filters from "./components/Filters.jsx";
import AddForm from "./components/AddForm.jsx";
import BooksGrid from "./components/BooksGrid.jsx";

/** ErrorBoundary con nombre del bloque que falla */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error(`Error en <${this.props.name}>:`, error, info); this.setState({ info }); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2 style={{ color: "#ffb4b4", marginTop: 0 }}>Ha fallado un componente: &lt;{this.props.name}&gt;</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#fff", background: "#1a1a1a", padding: 12, borderRadius: 8 }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Utils */
const normalize = (s = "") => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const statusOrder = { toread: 0, reading: 1, finished: 2 };
const STORAGE_KEY = "bibler.books.v1";
const SETTINGS_KEY = "bibler.settings.v1";

/** Semilla */
function seedBooks() {
  const now = Date.now();
  return [
    { id: 1, title: "1984", author: "George Orwell", status: "finished", cover: "https://covers.openlibrary.org/b/id/10521279-M.jpg", addedAt: now - 3000, rating: 9 },
    { id: 2, title: "The Pragmatic Programmer", author: "Andrew Hunt, David Thomas", status: "reading", cover: "https://covers.openlibrary.org/b/id/12629965-M.jpg", addedAt: now - 2000, rating: 8 },
    { id: 3, title: "El nombre de la rosa", author: "Umberto Eco", status: "toread", cover: "https://covers.openlibrary.org/b/id/8373226-M.jpg", addedAt: now - 1000, rating: 0 },
  ];
}



export default function App() {
  /** Estado principal (con fallback seguro) */
  const [books, setBooks] = useLocalStorage(STORAGE_KEY, seedBooks);
  const safeBooks = Array.isArray(books) ? books : [];

  const [filters, setFilters] = useState({ q: "", status: "all" });
  const [settings, setSettings] = useLocalStorage(SETTINGS_KEY, { sort: "title-asc" });
  const sortValue = typeof settings === "object" && settings ? settings.sort : "title-asc";


  useEffect(() => {
    if (!Array.isArray(books)) return;
    if (books.some(b => b && b.addedAt == null)) {
      const base = Date.now();
      // asigna un timestamp estable según el orden actual
      const migrated = books.map((b, idx) =>
        (b && b.addedAt == null)
          ? { ...b, addedAt: base - (books.length - idx) * 1000 }
          : b
      );
      setBooks(migrated);
    }
  }, [books, setBooks]);



  /** Live region (announce) */
  const liveRef = useRef(null);
  useEffect(() => { liveRef.current = document.getElementById("live"); }, []);
  const announce = useCallback((msg) => {
    const el = liveRef.current; if (!el) return;
    el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 20);
  }, []);

  /** Helpers CRUD */
  const cycleStatus = useCallback((s) => (s === "toread" ? "reading" : s === "reading" ? "finished" : "toread"), []);

  const addBook = useCallback((partial) => {
    setBooks(prev => {
      const base = Array.isArray(prev) ? prev : [];
      const nextId = base.length ? Math.max(...base.map(b => b.id)) + 1 : 1;
      return [...base, { id: nextId, addedAt: Date.now(), ...partial }];
    });

    announce(`Libro añadido: ${partial.title}.`);
  }, [setBooks, announce]);

  const deleteBook = useCallback((id) => {
    setBooks(prev => (Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev));
  }, [setBooks]);

  const updateBook = useCallback((id, patch) => {
    setBooks(prev => (Array.isArray(prev) ? prev.map(b => b.id === id ? { ...b, ...patch } : b) : prev));
  }, [setBooks]);

  /** Filtro + orden */
  const visible = useMemo(() => {
    const { q, status } = filters;
    const list = safeBooks.filter(b => {
      const inText = normalize(b.title).includes(normalize(q)) || normalize(b.author).includes(normalize(q));
      const statusOk = status === "all" ? true : b.status === status;
      return inText && statusOk;
    });

    const [field, dir] = String(sortValue).split("-");
    const sign = dir === "desc" ? -1 : 1;
    const byText = (a, b, key) => normalize(a[key]).localeCompare(normalize(b[key])) * sign;
    const byStatus = (a, b) => (statusOrder[a.status] - statusOrder[b.status]) * sign;
    const byAdded = (a, b) => ((a.addedAt ?? 0) - (b.addedAt ?? 0)) * sign;

    if (field === "title") return [...list].sort((a, b) => byText(a, b, "title"));
    if (field === "author") return [...list].sort((a, b) => byText(a, b, "author"));
    if (field === "status") return [...list].sort(byStatus);
    if (field === "addedAt") return [...list].sort(byAdded);
    return Array.isArray(list) ? list : [];
  }, [safeBooks, filters, sortValue]);

  /** Handlers UI */
  const onChangeFilters = (patch) => setFilters(f => ({ ...f, ...patch }));
  const onChangeSort = (sort) => setSettings(s => (typeof s === "object" && s ? { ...s, sort } : { sort }));

  /** Render */
  return (
    <>
      <header className="site-header">
        <div className="container">
          <h1>Bibler</h1>
          <nav aria-label="principal">
            <a href="#libros">Libros</a>
            <a href="#sobre">Sobre</a>
          </nav>
        </div>
      </header>

      <main className="container">
        <section aria-labelledby="titulo-libros" id="libros">
          <div className="section-head">
            <h2 id="titulo-libros">Tu biblioteca</h2>
            <ErrorBoundary name="Filters">
              <Filters
                q={filters.q}
                status={filters.status}
                sort={sortValue}
                onChangeFilters={onChangeFilters}
                onChangeSort={onChangeSort}
              />
            </ErrorBoundary>
          </div>

          <ErrorBoundary name="AddForm">
            <AddForm onAdd={addBook} announce={announce} />
          </ErrorBoundary>

          <ErrorBoundary name="BooksGrid">
            <BooksGrid
              books={Array.isArray(visible) ? visible : []}
              onDelete={(id, title) => {
                const ok = confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`);
                if (!ok) return;
                deleteBook(id);
                announce(`Eliminado: ${title}.`);
              }}
              onCycleStatus={(id, s, title) => {
                const next = cycleStatus(s);
                updateBook(id, { status: next });
                announce(`Estado actualizado: ${title}, ${next === "toread" ? "Por leer" : next === "reading" ? "Leyendo" : "Terminado"}.`);
              }}
              onEdit={(id, patch, title) => {
                updateBook(id, patch);
                announce(`Guardado: ${title}.`);
              }}
            />
          </ErrorBoundary>
        </section>

        <section id="sobre" aria-labelledby="titulo-sobre">
          <h2 id="titulo-sobre">Sobre el proyecto</h2>
          <p>Versión React de tu biblioteca. Próximos pasos: búsqueda externa unificada, 10 estrellas y reseñas.</p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <small>Hecho por Paloma · Accesible y responsive</small>
        </div>
      </footer>
    </>
  );
}
