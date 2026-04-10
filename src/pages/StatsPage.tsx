const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const weekWords = [320, 0, 1200, 450, 800, 1500, 550];
const maxWords = Math.max(...weekWords);

// Среднее кол-во знаков на слово в русском ~5.5
const wordsToChars = (words: number) => Math.round(words * 5.5);

const monthData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  words: Math.floor(Math.random() * 1200),
}));

export default function StatsPage() {
  const totalThisWeek = weekWords.reduce((a, b) => a + b, 0);
  const totalCharsWeek = wordsToChars(totalThisWeek);
  const avgPerDay = Math.round(totalThisWeek / weekWords.filter(Boolean).length);
  const bestDay = weekWords.indexOf(Math.max(...weekWords));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
      <h1 className="font-cormorant text-4xl font-light mb-8">Статистика</h1>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "За неделю", value: totalThisWeek.toLocaleString("ru"), unit: "слов", sub: `${totalCharsWeek.toLocaleString("ru")} зн.` },
          { label: "В среднем", value: avgPerDay.toLocaleString("ru"), unit: "слов / день", sub: `${wordsToChars(avgPerDay).toLocaleString("ru")} зн. / день` },
          { label: "Лучший день", value: weekDays[bestDay], unit: "на этой неделе", sub: null },
          { label: "Серия", value: "12", unit: "дней подряд", sub: null },
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-xl border border-border bg-card text-center">
            <div className="font-cormorant text-3xl font-light text-violet mb-0.5">{stat.value}</div>
            <div className="font-lora text-xs text-muted-foreground mb-0.5">{stat.unit}</div>
            {stat.sub && <div className="font-lora text-xs text-muted-foreground/50">{stat.sub}</div>}
            <div className="font-lora text-xs text-muted-foreground/60 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="p-6 rounded-xl border border-border bg-card mb-8">
        <h2 className="font-cormorant text-xl font-light mb-5">Эта неделя</h2>
        <div className="flex items-end gap-3 h-36">
          {weekWords.map((words, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="font-lora text-xs text-muted-foreground">{words > 0 ? words : ""}</span>
              <div className="w-full rounded-md transition-all"
                style={{
                  height: words > 0 ? `${(words / maxWords) * 100}px` : '4px',
                  minHeight: '4px',
                  background: words > 0
                    ? `hsl(var(--violet) / ${0.5 + (words / maxWords) * 0.5})`
                    : 'hsl(var(--muted))',
                }} />
              <span className="font-lora text-xs text-muted-foreground">{weekDays[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Month heatmap */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="font-cormorant text-xl font-light mb-5">Апрель</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {monthData.map((d) => (
            <div
              key={d.day}
              title={`${d.day} апреля: ${d.words} слов`}
              className="aspect-square rounded-sm transition-all hover:scale-110 cursor-default"
              style={{
                background: d.words > 0
                  ? `hsl(var(--violet) / ${0.15 + (d.words / 1200) * 0.85})`
                  : 'hsl(var(--muted))',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="font-lora text-xs text-muted-foreground">меньше</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
            <div key={o} className="w-3 h-3 rounded-sm"
              style={{ background: `hsl(var(--violet) / ${o})` }} />
          ))}
          <span className="font-lora text-xs text-muted-foreground">больше</span>
        </div>
      </div>
    </div>
  );
}