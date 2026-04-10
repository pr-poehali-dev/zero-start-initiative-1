import { useState, useEffect } from "react";
import { useBooks } from "@/hooks/useBooks";
import Icon from "@/components/ui/icon";

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
const MONTHS_FULL = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const BOOK_COLORS = [
  "hsl(267 45% 42%)",
  "hsl(210 55% 44%)",
  "hsl(150 40% 38%)",
  "hsl(30 60% 42%)",
];

type Period = "week" | "month" | "year";
type Metric = "words" | "chars";

const HISTORY_KEY = "scriptorium_writing_history"; // { "YYYY-MM-DD": chars_with_spaces }
const PREV_CHARS_KEY = "scriptorium_prev_total_chars";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadHistory(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}"); } catch { return {}; }
}

function saveHistory(h: Record<string, number>) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

// Записываем разницу знаков за сегодня
function recordTodayChars(totalChars: number): Record<string, number> {
  const prev = parseInt(localStorage.getItem(PREV_CHARS_KEY) || "0", 10);
  const diff = totalChars - prev;
  const history = loadHistory();
  const key = todayKey();

  if (diff > 0) {
    history[key] = (history[key] || 0) + diff;
    saveHistory(history);
    localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
  } else if (prev === 0 && totalChars > 0) {
    // Первый запуск — записываем всё сегодняшним днём
    history[key] = (history[key] || 0) + totalChars;
    saveHistory(history);
    localStorage.setItem(PREV_CHARS_KEY, String(totalChars));
  }
  return history;
}

// words в БД хранит знаки с пробелами напрямую
function charsToWords(chars: number) { return Math.round(chars / 6); }

export default function StatsPage() {
  const { books: userBooks } = useBooks();
  const realBooks = userBooks.filter((b) => b.title !== "[удалено]");

  const totalChars = realBooks.reduce((s, b) => s + b.words, 0); // words = знаки с пробелами
  const totalWords = charsToWords(totalChars);

  const [history, setHistory] = useState<Record<string, number>>({});
  const [period, setPeriod] = useState<Period>("week");
  const [metric, setMetric] = useState<Metric>("chars");
  const [bookGoals, setBookGoals] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem("scriptorium_book_goals") || "{}"); } catch { return {}; }
  });
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [goalDraft, setGoalDraft] = useState("");

  useEffect(() => {
    if (totalChars > 0) {
      const h = recordTodayChars(totalChars);
      setHistory(h);
    } else {
      setHistory(loadHistory());
    }
  }, [totalChars]);

  const setGoal = (bookId: number, chars: number) => {
    const updated = { ...bookGoals, [bookId]: chars };
    setBookGoals(updated);
    localStorage.setItem("scriptorium_book_goals", JSON.stringify(updated));
  };

  const toDisplay = (chars: number) => metric === "words" ? charsToWords(chars) : chars;
  const label = metric === "words" ? "слов" : "зн.";

  // ── WEEK DATA ──
  const now = new Date();
  const weekData: { day: string; date: string; chars: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const jsDay = d.getDay(); // 0=Sun
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    weekData.push({ day: WEEK_DAYS[dayIdx], date: key, chars: history[key] || 0 });
  }
  const weekValues = weekData.map((d) => toDisplay(d.chars));
  const maxWeek = Math.max(...weekValues, 1);
  const totalThisWeek = weekValues.reduce((a, b) => a + b, 0);
  const activeDays = weekValues.filter(Boolean).length;
  const avgPerDay = activeDays > 0 ? Math.round(totalThisWeek / activeDays) : 0;
  const bestDayIdx = weekValues.indexOf(Math.max(...weekValues));

  // ── MONTH DATA ──
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const monthData: { day: number; date: string; chars: number }[] = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const key = `${curYear}-${String(curMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { day: d, date: key, chars: history[key] || 0 };
  });
  const monthValues = monthData.map((d) => toDisplay(d.chars));
  const maxMonth = Math.max(...monthValues, 1);

  const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
  const offsetDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // ── YEAR DATA ──
  const yearData: { month: string; chars: number }[] = MONTHS_RU.map((m, i) => {
    let total = 0;
    const dInMonth = new Date(curYear, i + 1, 0).getDate();
    for (let d = 1; d <= dInMonth; d++) {
      const key = `${curYear}-${String(i + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      total += history[key] || 0;
    }
    return { month: m, chars: total };
  });
  const yearValues = yearData.map((d) => toDisplay(d.chars));
  const maxYear = Math.max(...yearValues, 1);

  const monthName = MONTHS_FULL[curMonth];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10 space-y-6">
      <h1 className="font-cormorant text-4xl font-light">Статистика</h1>

      {/* ── ALL-TIME TOTALS ── */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <p className="font-cormorant text-base italic text-muted-foreground mb-4">Всего написано за всё время</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-muted/30 text-center">
            <div className="font-cormorant text-4xl font-light text-violet leading-none mb-1">
              {totalWords.toLocaleString("ru")}
            </div>
            <div className="font-lora text-xs text-muted-foreground">слов</div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 text-center">
            <div className="font-cormorant text-4xl font-light text-violet leading-none mb-1">
              {totalChars.toLocaleString("ru")}
            </div>
            <div className="font-lora text-xs text-muted-foreground">знаков (с пробелами)</div>
          </div>
        </div>

        {/* Book cards */}
        <div className="grid md:grid-cols-3 gap-3">
          {realBooks.map((b, idx) => {
            const chars = b.words; // words хранит знаки с пробелами
            const goal = bookGoals[b.id];
            const pct = goal ? Math.min(100, Math.round((chars / goal) * 100)) : null;
            const color = BOOK_COLORS[idx % BOOK_COLORS.length];
            return (
              <div key={b.id} className="p-4 rounded-xl border border-border bg-background">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22` }}>
                    <Icon name="BookOpen" size={14} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-cormorant text-base font-medium leading-tight truncate">{b.title}</div>
                    <div className="font-lora text-xs text-muted-foreground">{b.genre}</div>
                  </div>
                </div>

                <div className="flex justify-between font-lora text-xs mb-1">
                  <span className="text-muted-foreground">{chars.toLocaleString("ru")} зн.</span>
                  <span style={{ color }}>~{charsToWords(chars).toLocaleString("ru")} сл.</span>
                </div>

                {pct === null && (
                  <button onClick={() => { setGoal(b.id, 50000); setEditingGoal(b.id); setGoalDraft("50000"); }}
                    className="font-lora text-[11px] text-muted-foreground/60 hover:text-violet transition-colors">
                    + Поставить цель
                  </button>
                )}

                {pct !== null && (
                  <>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="flex justify-between font-lora text-[10px] text-muted-foreground">
                      <span>{pct}% от цели</span>
                      {editingGoal === b.id ? (
                        <div className="flex items-center gap-1">
                          <input value={goalDraft}
                            onChange={(e) => setGoalDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = parseInt(goalDraft.replace(/\D/g, ""));
                                if (v > 0) setGoal(b.id, v);
                                setEditingGoal(null);
                              }
                              if (e.key === "Escape") setEditingGoal(null);
                            }}
                            className="w-20 border border-border rounded px-1 py-0.5 font-lora text-[10px] bg-background focus:outline-none"
                            placeholder="цель знаков"
                            autoFocus />
                          <button onClick={() => {
                            const v = parseInt(goalDraft.replace(/\D/g, ""));
                            if (v > 0) setGoal(b.id, v);
                            setEditingGoal(null);
                          }} className="text-violet hover:opacity-70">✓</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingGoal(b.id); setGoalDraft(String(goal)); }}
                          className="hover:opacity-70 transition-opacity">
                          цель: {goal.toLocaleString("ru")} зн. ✎
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["week", "month", "year"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-lora text-xs transition-all ${period === p ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                style={period === p ? { background: 'hsl(var(--violet))' } : {}}>
                {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["chars", "words"] as Metric[]).map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-md font-lora text-xs transition-all ${metric === m ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                style={metric === m ? { background: 'hsl(var(--violet))' } : {}}>
                {m === "words" ? "Слова" : "Знаки"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* WEEK */}
          {period === "week" && (
            <div className="flex items-end gap-2 h-40">
              {weekData.map((d, i) => {
                const val = weekValues[i];
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="font-lora text-[10px] text-muted-foreground">
                      {val > 0 ? (val >= 1000 ? `${(val / 1000).toFixed(1)}к` : val) : ""}
                    </span>
                    <div className="w-full rounded-md transition-all"
                      style={{
                        height: val > 0 ? `${Math.max(6, (val / maxWeek) * 120)}px` : '4px',
                        background: val > 0
                          ? `hsl(var(--violet) / ${0.45 + (val / maxWeek) * 0.55})`
                          : 'hsl(var(--muted))',
                      }} />
                    <span className="font-lora text-xs text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* MONTH HEATMAP */}
          {period === "month" && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="font-lora text-[10px] text-muted-foreground/60 text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offsetDays }).map((_, i) => <div key={`off-${i}`} />)}
                {monthData.map((d) => {
                  const val = toDisplay(d.chars);
                  const hasData = val > 0;
                  return (
                    <div key={d.day}
                      className="aspect-square rounded-sm transition-all hover:scale-105 cursor-default relative group"
                      style={{
                        background: hasData
                          ? `hsl(var(--violet) / ${0.2 + (val / maxMonth) * 0.8})`
                          : 'hsl(var(--muted))',
                      }}>
                      {/* Число */}
                      <span className="absolute top-0.5 left-1 font-lora leading-none"
                        style={{ fontSize: '9px', color: hasData ? 'rgba(255,255,255,0.85)' : 'hsl(var(--muted-foreground))' }}>
                        {d.day}
                      </span>
                      {/* Значение при наведении */}
                      {hasData && (
                        <span className="absolute bottom-0.5 left-0 right-0 text-center font-lora leading-none text-white/90"
                          style={{ fontSize: '8px' }}>
                          {val >= 1000 ? `${(val / 1000).toFixed(1)}к` : val}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background font-lora text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.day} {monthName}: {val > 0 ? `${val.toLocaleString("ru")} ${label}` : "нет данных"}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 justify-between">
                <span className="font-lora text-xs text-muted-foreground">{monthName} {curYear}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-lora text-xs text-muted-foreground">меньше</span>
                  {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
                    <div key={o} className="w-3 h-3 rounded-sm"
                      style={{ background: `hsl(var(--violet) / ${o})` }} />
                  ))}
                  <span className="font-lora text-xs text-muted-foreground">больше</span>
                </div>
              </div>
            </div>
          )}

          {/* YEAR */}
          {period === "year" && (
            <div>
              <div className="flex items-end gap-1.5 h-40 mb-1">
                {yearData.map((d, i) => {
                  const val = yearValues[i];
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="font-lora text-[10px] text-muted-foreground">
                        {val > 0 ? `${Math.round(val / 1000)}к` : ""}
                      </span>
                      <div className="w-full rounded-md transition-all"
                        style={{
                          height: val > 0 ? `${Math.max(6, (val / maxYear) * 120)}px` : '4px',
                          background: val > 0
                            ? `hsl(var(--violet) / ${0.45 + (val / maxYear) * 0.55})`
                            : 'hsl(var(--muted))',
                        }} />
                      <span className="font-lora text-xs text-muted-foreground">{d.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-lora text-xs text-muted-foreground">{curYear} год</span>
                <span className="font-lora text-xs text-muted-foreground">
                  итого: {yearValues.reduce((a, b) => a + b, 0).toLocaleString("ru")} {label}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KEY METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "За неделю",   value: totalThisWeek.toLocaleString("ru"),              unit: label },
          { label: "В среднем",   value: avgPerDay.toLocaleString("ru"),                   unit: `${label} / день` },
          { label: "Лучший день", value: activeDays > 0 ? weekData[bestDayIdx]?.day : "—", unit: "эта неделя" },
          { label: "Активных",    value: String(activeDays),                               unit: "дней за неделю" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="font-cormorant text-3xl font-light text-violet leading-none mb-0.5">{s.value}</div>
            <div className="font-lora text-xs text-muted-foreground">{s.unit}</div>
            <div className="font-lora text-[10px] text-muted-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}