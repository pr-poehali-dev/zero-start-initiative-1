import { useState } from "react";
import { wordsToChars } from "@/data/books";
import { useBooks } from "@/hooks/useBooks";
import Icon from "@/components/ui/icon";

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

const BOOK_COLORS = [
  "hsl(267 45% 42%)",
  "hsl(210 55% 44%)",
  "hsl(150 40% 38%)",
  "hsl(30 60% 42%)",
];

type Period = "week" | "month" | "year";
type Metric = "words" | "chars";

// Генерируем демо-данные на основе реального totalWords пользователя
function makeWeekData(total: number): number[] {
  if (total === 0) return [0, 0, 0, 0, 0, 0, 0];
  const base = Math.round(total / 14); // среднее за 2 недели
  return [
    Math.round(base * 0.6), 0,
    Math.round(base * 1.2), Math.round(base * 0.8), 0,
    Math.round(base * 1.5), Math.round(base * 0.9),
  ];
}

function makeMonthData(total: number): { day: number; words: number }[] {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (total === 0) return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, words: 0 }));
  const base = Math.round(total / 14);
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    words: (i < 14 && i !== 1 && i !== 4) ? Math.round(base * (0.5 + Math.abs(Math.sin(i * 2.3)) * 1.2)) : 0,
  }));
}

function makeYearData(total: number): { month: string; words: number }[] {
  const now = new Date();
  const curMonth = now.getMonth();
  if (total === 0) return MONTHS_RU.map((m) => ({ month: m, words: 0 }));
  return MONTHS_RU.map((m, i) => ({
    month: m,
    words: i <= curMonth && i >= curMonth - 3 ? Math.round(total * (0.1 + Math.abs(Math.sin(i * 1.7)) * 0.3)) : 0,
  }));
}

export default function StatsPage() {
  const { books: userBooks } = useBooks();
  const realBooks = userBooks.filter((b) => b.title !== "[удалено]");

  const totalWords = realBooks.reduce((s, b) => s + b.words, 0);
  const totalChars = wordsToChars(totalWords);

  const weekWords = makeWeekData(totalWords);
  const monthData = makeMonthData(totalWords);
  const yearMonths = makeYearData(totalWords);

  const [period, setPeriod] = useState<Period>("week");
  const [metric, setMetric] = useState<Metric>("words");
  const [bookGoals, setBookGoals] = useState<Record<number, number>>({});
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [goalDraft, setGoalDraft] = useState("");

  const totalThisWeek = weekWords.reduce((a, b) => a + b, 0);
  const activeDays = weekWords.filter(Boolean).length;
  const avgPerDay = activeDays > 0 ? Math.round(totalThisWeek / activeDays) : 0;
  const bestDay = weekWords.indexOf(Math.max(...weekWords));

  const toDisplay = (w: number) => metric === "words" ? w : wordsToChars(w);
  const label = metric === "words" ? "слов" : "зн.";

  const weekValues = weekWords.map(toDisplay);
  const maxWeek = Math.max(...weekValues, 1);

  const maxMonth = Math.max(...monthData.map((d) => toDisplay(d.words)), 1);

  const yearValues = yearMonths.map((m) => toDisplay(m.words));
  const maxYear = Math.max(...yearValues, 1);

  // Текущий месяц и год
  const now = new Date();
  const monthName = MONTHS_RU[now.getMonth()];
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const offsetDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

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
            <div className="font-lora text-xs text-muted-foreground">знаков без пробелов</div>
          </div>
        </div>

        {/* Book cards */}
        <div className="grid md:grid-cols-3 gap-3">
          {realBooks.map((b, idx) => {
            const chars = wordsToChars(b.words);
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
                  <span className="text-muted-foreground">{b.words.toLocaleString("ru")} сл.</span>
                  <span style={{ color }}>{chars.toLocaleString("ru")} зн.</span>
                </div>

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
                                if (v > 0) setBookGoals({ ...bookGoals, [b.id]: v });
                                setEditingGoal(null);
                              }
                              if (e.key === "Escape") setEditingGoal(null);
                            }}
                            className="w-20 border border-border rounded px-1 py-0.5 font-lora text-[10px] bg-background focus:outline-none"
                            placeholder="цель знаков"
                            autoFocus />
                          <button onClick={() => {
                            const v = parseInt(goalDraft.replace(/\D/g, ""));
                            if (v > 0) setBookGoals({ ...bookGoals, [b.id]: v });
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
        {/* Period + metric toggles */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["week", "month", "year"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md font-lora text-xs transition-all ${
                  period === p ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                style={period === p ? { background: 'hsl(var(--violet))' } : {}}>
                {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(["words", "chars"] as Metric[]).map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-md font-lora text-xs transition-all ${
                  metric === m ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                style={metric === m ? { background: 'hsl(var(--violet))' } : {}}>
                {m === "words" ? "Слова" : "Знаки"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* WEEK BAR CHART */}
          {period === "week" && (
            <div className="flex items-end gap-2 h-40">
              {weekValues.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="font-lora text-[10px] text-muted-foreground">
                    {val > 0 ? (val >= 1000 ? `${(val / 1000).toFixed(1)}к` : val) : ""}
                  </span>
                  <div className="w-full rounded-md transition-all"
                    style={{
                      height: val > 0 ? `${Math.max(4, (val / maxWeek) * 120)}px` : '4px',
                      background: val > 0
                        ? `hsl(var(--violet) / ${0.45 + (val / maxWeek) * 0.55})`
                        : 'hsl(var(--muted))',
                    }} />
                  <span className="font-lora text-xs text-muted-foreground">{WEEK_DAYS[i]}</span>
                </div>
              ))}
            </div>
          )}

          {/* MONTH HEATMAP */}
          {period === "month" && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => (
                  <div key={d} className="font-lora text-[10px] text-muted-foreground/60 text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: offsetDays }).map((_, i) => <div key={`off-${i}`} />)}
                {monthData.map((d) => {
                  const val = toDisplay(d.words);
                  return (
                    <div key={d.day}
                      title={`${d.day} ${monthName}: ${val.toLocaleString("ru")} ${label}`}
                      className="aspect-square rounded-sm transition-all hover:scale-110 cursor-default relative group">
                      <div className="w-full h-full rounded-sm"
                        style={{
                          background: val > 0
                            ? `hsl(var(--violet) / ${0.15 + (val / maxMonth) * 0.85})`
                            : 'hsl(var(--muted))',
                        }} />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background font-lora text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.day} {monthName}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 justify-between">
                <span className="font-lora text-xs text-muted-foreground">{monthName} {now.getFullYear()}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-lora text-xs text-muted-foreground">меньше</span>
                  {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
                    <div key={o} className="w-3 h-3 rounded-sm"
                      style={{ background: `hsl(var(--violet) / ${o})` }} />
                  ))}
                  <span className="font-lora text-xs text-muted-foreground">больше</span>
                </div>
              </div>
            </div>
          )}

          {/* YEAR BAR CHART */}
          {period === "year" && (
            <div>
              <div className="flex items-end gap-1.5 h-40 mb-1">
                {yearValues.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="font-lora text-[10px] text-muted-foreground">
                      {val > 0 ? `${Math.round(val / 1000)}к` : ""}
                    </span>
                    <div className="w-full rounded-md transition-all"
                      style={{
                        height: val > 0 ? `${Math.max(4, (val / maxYear) * 120)}px` : '4px',
                        background: val > 0
                          ? `hsl(var(--violet) / ${0.45 + (val / maxYear) * 0.55})`
                          : 'hsl(var(--muted))',
                      }} />
                    <span className="font-lora text-xs text-muted-foreground">{MONTHS_RU[i]}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-lora text-xs text-muted-foreground">2026 год</span>
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
          { label: "За неделю",   value: toDisplay(totalThisWeek).toLocaleString("ru"), unit: label },
          { label: "В среднем",   value: toDisplay(avgPerDay).toLocaleString("ru"),     unit: `${label} / день` },
          { label: "Лучший день", value: WEEK_DAYS[bestDay],                             unit: "эта неделя" },
          { label: "Серия",       value: String(activeDays),                              unit: "дней подряд" },
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