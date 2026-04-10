import { useState, useEffect, useCallback } from "react";

const BOOKS_URL = "https://functions.poehali.dev/27a194ed-173e-4e53-965e-f5f826d5f69e";
const TOKEN_KEY = "scriptorium_token";

export interface BookMeta {
  id: number;
  title: string;
  genre: string;
  words: number;
  updated_at: string;
}

export interface BookFull extends BookMeta {
  manuscript: string;
  synopsis: string;
  characters: string;
  plan: string;
  lore_tags: string;
  lore_notes: string;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function apiFetch(body: object) {
  return fetch(BOOKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Token": getToken() },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

export function useBooks() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    const data = await apiFetch({ action: "list" });
    if (data.books) setBooks(data.books);
    setLoading(false);
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const createBook = async (title: string, genre: string): Promise<BookMeta | null> => {
    const data = await apiFetch({ action: "create", title, genre });
    if (data.book) {
      setBooks((prev) => [data.book, ...prev]);
      return data.book;
    }
    return null;
  };

  const updateBook = async (bookId: number, fields: Partial<{
    title: string; genre: string; manuscript: string; synopsis: string;
    characters: string; plan: string; lore_tags: string; lore_notes: string;
  }>) => {
    const data = await apiFetch({ action: "update", book_id: bookId, ...fields });
    if (data.book) {
      setBooks((prev) => prev.map((b) => b.id === bookId ? { ...b, ...data.book } : b));
    }
  };

  const deleteBook = async (bookId: number) => {
    await apiFetch({ action: "delete", book_id: bookId });
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const getBook = async (bookId: number): Promise<BookFull | null> => {
    const data = await apiFetch({ action: "get", book_id: bookId });
    return data.book || null;
  };

  const recountBooks = async () => {
    await apiFetch({ action: "recount" });
    await loadBooks();
  };

  return { books, loading, loadBooks, createBook, updateBook, deleteBook, getBook, recountBooks };
}