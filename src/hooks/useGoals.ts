import { useState, useEffect, useCallback } from "react";
import { BookMeta } from "@/hooks/useBooks";

const GOALS_URL = "https://functions.poehali.dev/7142dc4e-053d-4053-8dd9-dbae6cb97da3";
const BOOKS_URL = "https://functions.poehali.dev/27a194ed-173e-4e53-965e-f5f826d5f69e";
const TOKEN_KEY = "scriptorium_token";
const GOALS_KEY = "scriptorium_book_goals";
const HISTORY_KEY = "scriptorium_writing_history";
const PREV_CHARS_KEY = "scriptorium_prev_total_chars";
// Флаг: baseline уже был установлен (чтобы не путать "0 prev" с "первым входом")
const BASELINE_SET_KEY = "scriptorium_baseline_set";

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

function loadGoalsLocal(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}"); } catch { return {}; }
}

function loadHistoryLocal(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); } catch { return {}; }
}

// Считает streak: сколько дней подряд (включая сегодня) есть хоть какой-то прирост
export function calcStreak(history: Record<string, number>): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((history[key] || 0) > 0) {
      streak++;
    } else if (i > 0) {
      // Пропустили день — цепочка прервана
      break;
    }
    // i === 0 (сегодня) с нулём — продолжаем смотреть вчера
  }
  return streak;
}

export function useGoals(totalChars: number, books: BookMeta[] = []) {
  const [bookGoals, setBookGoals] = useState<Record<number, number>>(loadGoalsLocal);
  const [history, setHistory] = useState<Record<string, number>>(loadHistoryLocal);
  const [synced, setSynced] = useState(false);

  // При монтировании — грузим цели и историю из API
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
      // Всегда берём историю с сервера (там правильные данные после сброса)
      const serverHistory = histData.history || {};
      setHistory(serverHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(serverHistory));
      setSynced(true);
    }).catch(() => {
      setSynced(true);
    });
  }, []);

  // Отслеживаем прирост знаков
  useEffect(() => {
    if (!synced || totalChars === 0 || books.length === 0) return;

    const baselineSet = localStorage.getItem(BASELINE_SET_KEY) === "1";
    const prev = parseInt(localStorage.getItem(PREV_CHARS_KEY) || "0", 10);

    if (!baselineSet) {
      // Первый вход на этом устройстве — запоминаем baseline, ничего в историю не пишем
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
      localStorage.setItem(BASELINE_SET_KEY, "1");
      return;
    }

    if (totalChars > prev) {
      // Написано новое — записываем прирост за сегодня
      const diff = totalChars - prev;
      const today = todayKey();
      const currentHistory = loadHistoryLocal();
      const updated = { ...currentHistory, [today]: (currentHistory[today] || 0) + diff };

      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));

      apiFetch(GOALS_URL, { action: "record_day", day: today, chars: updated[today] }).catch(() => {});
    } else if (totalChars < prev) {
      // Удалили — обновляем baseline, но в историю ничего не пишем
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
    }
    // totalChars === prev — ничего не делаем
  }, [synced, totalChars, books.length]);  

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