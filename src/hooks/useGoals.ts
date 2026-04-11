import { useState, useEffect, useCallback } from "react";

const GOALS_URL = "https://functions.poehali.dev/7142dc4e-053d-4053-8dd9-dbae6cb97da3";
const TOKEN_KEY = "scriptorium_token";
const GOALS_KEY = "scriptorium_book_goals";
const HISTORY_KEY = "scriptorium_writing_history";
const PREV_CHARS_KEY = "scriptorium_prev_total_chars";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function apiFetch(body: object) {
  return fetch(GOALS_URL, {
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

export function useGoals(totalChars: number) {
  const [bookGoals, setBookGoals] = useState<Record<number, number>>(loadGoalsLocal);
  const [history, setHistory] = useState<Record<string, number>>(loadHistoryLocal);
  const [synced, setSynced] = useState(false);

  // При монтировании — грузим из API
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    Promise.all([
      apiFetch({ action: "get_goals" }),
      apiFetch({ action: "get_history" }),
    ]).then(([goalsData, histData]) => {
      if (goalsData.goals) {
        const goals: Record<number, number> = {};
        for (const [k, v] of Object.entries(goalsData.goals)) {
          goals[Number(k)] = v as number;
        }
        setBookGoals(goals);
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      }
      if (histData.history) {
        setHistory(histData.history);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(histData.history));
      }
      setSynced(true);
    }).catch(() => {
      setSynced(true);
    });
  }, []);

  // Записываем прогресс за сегодня как только получили totalChars и синхронизировались
  useEffect(() => {
    if (!synced || totalChars === 0) return;

    const MIGRATION_KEY = "scriptorium_history_cleaned_v2";
    const key = todayKey();

    let currentHistory = { ...history };

    if (!localStorage.getItem(MIGRATION_KEY)) {
      if (currentHistory[key] && currentHistory[key] >= totalChars * 0.95) {
        delete currentHistory[key];
      }
      localStorage.setItem(MIGRATION_KEY, "1");
    }

    const prev = parseInt(localStorage.getItem(PREV_CHARS_KEY) || "0", 10);
    const diff = totalChars - prev;

    if (prev === 0 && totalChars > 0) {
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
    } else if (diff > 0) {
      currentHistory = { ...currentHistory, [key]: (currentHistory[key] || 0) + diff };
      setHistory(currentHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(currentHistory));
      localStorage.setItem(PREV_CHARS_KEY, String(totalChars));

      const token = getToken();
      if (token) {
        apiFetch({ action: "record_day", day: key, chars: currentHistory[key] }).catch(() => {});
      }
    } else {
      setHistory(currentHistory);
    }
  }, [synced, totalChars]); // eslint-disable-line react-hooks/exhaustive-deps

  const setGoal = useCallback((bookId: number, chars: number) => {
    const updated = { ...bookGoals, [bookId]: chars };
    setBookGoals(updated);
    localStorage.setItem(GOALS_KEY, JSON.stringify(updated));

    const token = getToken();
    if (token) {
      apiFetch({ action: "set_goal", book_id: bookId, goal_chars: chars }).catch(() => {});
    }
  }, [bookGoals]);

  return { bookGoals, history, setGoal };
}
