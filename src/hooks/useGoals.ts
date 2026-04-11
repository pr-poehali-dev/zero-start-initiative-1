import { useState, useEffect, useCallback } from "react";
import { BookMeta } from "@/hooks/useBooks";

const GOALS_URL = "https://functions.poehali.dev/7142dc4e-053d-4053-8dd9-dbae6cb97da3";
const BOOKS_URL = "https://functions.poehali.dev/27a194ed-173e-4e53-965e-f5f826d5f69e";
const TOKEN_KEY = "scriptorium_token";
const GOALS_KEY = "scriptorium_book_goals";
const HISTORY_KEY = "scriptorium_writing_history";
const PREV_CHARS_KEY = "scriptorium_prev_total_chars";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function apiFetch(url: string, body: object) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Token": getToken() },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function loadGoalsLocal(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}"); } catch { return {}; }
}

function loadHistoryLocal(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); } catch { return {}; }
}

// Инициализация истории по updated_at книг:
// если в истории нет записей, записываем текущие chars на дату последнего обновления каждой книги
function buildInitialHistory(books: BookMeta[]): Record<string, number> {
  const history: Record<string, number> = {};
  for (const book of books) {
    if (!book.words || book.title === "[удалено]") continue;
    const day = book.updated_at ? book.updated_at.slice(0, 10) : todayKey();
    history[day] = (history[day] || 0) + book.words;
  }
  return history;
}

export function useGoals(totalChars: number, books: BookMeta[] = []) {
  const [bookGoals, setBookGoals] = useState<Record<number, number>>(loadGoalsLocal);
  const [history, setHistory] = useState<Record<string, number>>(loadHistoryLocal);
  const [synced, setSynced] = useState(false);

  // При монтировании — грузим из API
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    Promise.all([
      apiFetch(GOALS_URL, { action: "get_goals" }),
      apiFetch(GOALS_URL, { action: "get_history" }),
    ]).then(([goalsData, histData]) => {
      if (goalsData.goals) {
        const goals: Record<number, number> = {};
        for (const [k, v] of Object.entries(goalsData.goals)) {
          goals[Number(k)] = v as number;
        }
        setBookGoals(goals);
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      }

      if (histData.history && Object.keys(histData.history).length > 0) {
        setHistory(histData.history);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(histData.history));
      }
      setSynced(true);
    }).catch(() => {
      setSynced(true);
    });
  }, []);

  // Когда получили книги и синхронизировались — инициализируем историю если она пустая
  useEffect(() => {
    if (!synced || books.length === 0) return;

    const serverHistory = loadHistoryLocal();
    const hasHistory = Object.keys(serverHistory).length > 0;

    // Если история пустая — строим из данных книг
    if (!hasHistory) {
      const initHistory = buildInitialHistory(books);
      if (Object.keys(initHistory).length > 0) {
        setHistory(initHistory);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(initHistory));
        // Сохраняем в БД
        apiFetch(GOALS_URL, { action: "save_history", history: initHistory }).catch(() => {});
        // Запоминаем текущий baseline
        localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
        return;
      }
    }

    // Обычная логика записи за сегодня
    const today = todayKey();
    const prev = parseInt(localStorage.getItem(PREV_CHARS_KEY) || "0", 10);
    const diff = totalChars - prev;

    if (prev === 0 && totalChars > 0) {
      // Первый запуск на этом устройстве — запоминаем baseline
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
    } else if (diff > 0) {
      const currentHistory = { ...serverHistory, [today]: (serverHistory[today] || 0) + diff };
      setHistory(currentHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(currentHistory));
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));

      apiFetch(GOALS_URL, { action: "record_day", day: today, chars: currentHistory[today] }).catch(() => {});
    }
  }, [synced, books.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const setGoal = useCallback((bookId: number, chars: number) => {
    const updated = { ...bookGoals, [bookId]: chars };
    setBookGoals(updated);
    localStorage.setItem(GOALS_KEY, JSON.stringify(updated));

    const token = getToken();
    if (token) {
      apiFetch(GOALS_URL, { action: "set_goal", book_id: bookId, goal_chars: chars }).catch(() => {});
    }
  }, [bookGoals]);

  const reorderBooks = useCallback((orderedIds: number[]) => {
    apiFetch(BOOKS_URL, { action: "reorder", ordered_ids: orderedIds }).catch(() => {});
  }, []);

  return { bookGoals, history, setGoal, reorderBooks };
}
