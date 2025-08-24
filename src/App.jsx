import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import Filters from "./components/Filters.jsx";
import AddForm from "./components/AddForm.jsx";
import BooksGrid from "./components/BooksGrid.jsx";

// ---- Utils ----
const LS_KEY = "bibler:books:v1";
const LS_PREF_KEY = "bibler:prefs:v1";

const statusOrder = { toread: 0, reading: 1, finished: 2 };

function normalize(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function seedBooks() {
  const now = Date.now();
  return [
    {
      id: 1,
      title: "1984",
      author: "George Orwell",
      status: "finished",
      cover: "https://covers.openlibrary.org/b/id/10521279-M.jpg",
      addedAt: now - 3000,
      rating: 9,
      review: null,
      audioReview: null,
    },
    {
      id: 2,
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt, David Thomas",
      status: "reading",
      cover: "https://covers.openlibrary.org/b/id/12629965-M.jpg",
      addedAt: now - 2000,
      rating: 8,
      review: null,
      audioReview: null,
    },
    {
      id: 3,
      title: "El nombre de la rosa",
      author: "Umberto Eco",
      status: "toread",
      cover: "https://covers.openlibrary.org/b/id/8373226-M.jpg",
      addedAt: now - 1000,
      rating: 0,
      review: null,
      audioReview: null,
    },
  ];
}

export default function App() {
  const { t } = useTranslation();

  // ---- Estado principal ----
  const [books, setBooks] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : seedBooks();
    } catch {
      return seedBooks();
    }
  });

  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PREF_KEY);
      const pref = raw ? JSON.parse(raw) : null;
      return pref?.filters ?? { q: "", status: "all" };
    } catch {
      return { q: "", status: "all" };
    }
  });

  const [sort, setSort] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PREF_KEY);
      const pref = raw ? JSON.parse(raw) : null;
      return pref?.sort ?? "addedAt-desc";
    } catch {
      return "addedAt-desc";
    }
  });

  // ---- Persistencia ----
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(books));
    } catch { }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_PREF_KEY,
        JSON.stringify({ filters, sort })
      );
    } catch { }
  }, [filters, sort]);

  // ---- Live region (anuncios accesibles) ----
  const liveRef = useRef(null);
  const announce = (msg) => {
    if (liveRef.current) {
      liveRef.current.textContent = msg;
    }
  };

  // ---- Derivados: filtrado + orden ----
  const visible = useMemo(() => {
    if (!Array.isArray(books)) return [];

    // filtro por texto y estado
    const qn = normalize(filters.q).trim();
    let list = books.filter((b) => {
      const statusOK = filters.status === "all" ? true : b.status === filters.status;
      if (!statusOK) return false;
      if (!qn) return true;
      const hay =
        normalize(b.title).includes(qn) ||
        normalize(b.author).includes(qn);
      return hay;
    });

    // orden
    const [field, dir] = String(sort).split("-");
    const sign = dir === "desc" ? -1 : 1;

    const byText = (a, b, key) =>
      normalize(a[key]).localeCompare(normalize(b[key])) * sign;
    const byStatus = (a, b) =>
      (statusOrder[a.status] - statusOrder[b.status]) * sign;
    const byAdded = (a, b) =>
      ((a.addedAt ?? 0) - (b.addedAt ?? 0)) * sign;
    const byRating = (a, b) =>
      ((a.rating ?? 0) - (b.rating ?? 0)) * sign;

    if (field === "title") return [...list].sort((a, b) => byText(a, b, "title"));
    if (field === "author") return [...list].sort((a, b) => byText(a, b, "author"));
    if (field === "status") return [...list].sort(byStatus);
    if (field === "addedAt") return [...list].sort(byAdded);
    if (field === "rating") return [...list].sort(byRating);

    return list;
  }, [books, filters.q, filters.status, sort]);

  // ---- Handlers ----
  const handleAdd = (data) => {
    const tTitle = (data?.title ?? "").trim();
    const tAuthor = (data?.author ?? "").trim();
    if (!tTitle || !tAuthor) return;

    const next = {
      id: (books.at(-1)?.id ?? 0) + 1,
      title: tTitle,
      author: tAuthor,
      status: data?.status || "toread",
      cover: (data?.cover ?? "").trim(),
      addedAt: Date.now(),
      rating: 0,
      review: null,
      audioReview: null,
    };
    setBooks((prev) => [next, ...prev]);
    announce(t("book.saved", { title: tTitle }));
  };

  const handleDelete = (id, title) => {
    const ok = confirm(t("book.deleteConfirm", { title }));
    if (!ok) return;
    setBooks((prev) => prev.filter((b) => b.id !== id));
    announce(t("book.saved", { title })); // reutilizamos el mensaje de feedback
  };

  const handleCycleStatus = (id, currentStatus, title) => {
    const order = ["toread", "reading", "finished"];
    const next = order[(order.indexOf(currentStatus) + 1) % order.length];
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: next } : b))
    );
    announce(t("book.saved", { title }));
  };

  const handleEdit = (id, patch, title) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
    announce(t("book.saved", { title }));
  };

  const handleFilters = (partial) => {
    setFilters((f) => ({ ...f, ...partial }));
  };

  // ---- Render ----
  return (
    <>
      <header className="site-header">
        <div className="container">
          <div>
            <h1>{t("app.title")}</h1>
            <p className="slogan">{t("app.slogan")}</p>
          </div>
          <nav>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main className="container" id="contenido">
        {/* Añadir libro */}
        <section className="form-add" aria-labelledby="add-title">
          <h2 id="add-title" className="sr-only">{t("addForm.title")}</h2>
          <AddForm onAdd={handleAdd} />
        </section>

        {/* Filtros y orden */}
        <div className="section-head">
          <h2 style={{ margin: 0 }}>{t("nav.home")}</h2>
          <Filters
            q={filters.q}
            status={filters.status}
            sort={sort}
            onChangeFilters={handleFilters}
            onChangeSort={setSort}
          />
        </div>

        {/* Grid de libros */}
        <BooksGrid
          books={visible}
          onDelete={handleDelete}
          onCycleStatus={handleCycleStatus}
          onEdit={handleEdit}
        />
      </main>

      <footer className="site-footer">
        <div className="container">
          <small>© {new Date().getFullYear()} Bibler</small>
        </div>
      </footer>

      {/* Live region para anuncios accesibles */}
      <div
        ref={liveRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </>
  );
}
