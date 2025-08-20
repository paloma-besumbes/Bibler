// src/services/covers.js
const GB_BASE = "https://www.googleapis.com/books/v1/volumes";

async function googleBooksByISBN(isbn, apiKey) {
    const url = new URL(GB_BASE);
    url.searchParams.set("q", `isbn:${isbn}`);
    if (apiKey) url.searchParams.set("key", apiKey);

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const vol = data.items?.[0];
    const links = vol?.volumeInfo?.imageLinks;
    if (!links) return null;

    const candidates = [
        links.extraLarge, links.large, links.medium,
        links.small, links.thumbnail, links.smallThumbnail
    ].filter(Boolean);

    const picked = candidates[0]?.replace(/^http:/, "https:");
    return picked ? { url: picked, source: "google", volumeId: vol?.id } : null;
}

function olCoverByISBN(isbn, size = "L") {
    return { url: `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`, source: "openlibrary" };
}
function olCoverById(coverId, size = "L") {
    return { url: `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`, source: "openlibrary" };
}

async function googleBooksByQuery(title, author, apiKey) {
    const url = new URL(GB_BASE);
    const q = `${title}${author ? ` inauthor:${author}` : ""}`;
    url.searchParams.set("q", q);
    url.searchParams.set("maxResults", "1");
    if (apiKey) url.searchParams.set("key", apiKey);

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const vol = data.items?.[0];
    const links = vol?.volumeInfo?.imageLinks;
    if (!links) return null;

    const candidates = [
        links.extraLarge, links.large, links.medium,
        links.small, links.thumbnail, links.smallThumbnail
    ].filter(Boolean);

    const picked = candidates[0]?.replace(/^http:/, "https:");
    return picked ? { url: picked, source: "google", volumeId: vol?.id } : null;
}

export async function bestCover({ title, author, isbns = [], coverId }, apiKey) {
    // 1) Google por ISBN (mejor probabilidad de portada moderna)
    for (const isbn of isbns) {
        try {
            const g = await googleBooksByISBN(isbn, apiKey);
            if (g?.url) return g;
        } catch { }
    }
    // 2) Open Library por ISBN o cover id
    if (isbns[0]) return olCoverByISBN(isbns[0], "L");
    if (coverId) return olCoverById(coverId, "L");
    // 3) Último intento: Google por título+autor
    if (title) {
        try {
            const gq = await googleBooksByQuery(title, author, apiKey);
            if (gq?.url) return gq;
        } catch { }
    }
    return null;
}
