import { useBooks } from "@/hooks/useBooks";
import { useGoals, calcStreak } from "@/hooks/useGoals";

type Page = "home" | "books" | "stats" | "profile" | "help";

interface Props {
  onNavigate: (page: Page) => void;
}

const quotes = [
  { text: "Величайшее умение писателя — это уметь вычёркивать. Кто умеет и кто в силах своё вычёркивать, тот далеко пойдёт.", author: "Ф. М. Достоевский" },
  { text: "Настоящий писатель — это то же, что древний пророк: он видит яснее, чем обычные люди.", author: "А. П. Чехов" },
  { text: "Писать должно либо о том, что ты знаешь очень хорошо, либо о том, чего не знает никто.", author: "А. и Б. Стругацкие" },
  { text: "У пишущего человека мысли спорят между собой на каждой странице, в каждой строке, за каждое слово.", author: "Р. Г. Гамзатов" },
  { text: "Запиши это. Рискни. Это может быть плохо, но это единственный способ сделать что-то действительно хорошее.", author: "Уильям Фолкнер" },
  { text: "Никогда не используй длинное слово там, где подойдёт короткое.", author: "Джордж Оруэлл" },
  { text: "Твоя интуиция знает, что писать, так что уйди с дороги.", author: "Рэй Брэдбери" },
  { text: "Писать всё равно что создавать скульптуру — вы убираете, отбрасываете, чтобы воплотить замысел.", author: "Эли Визель" },
  { text: "Бесполезно думать, чтобы выйти из писательского кризиса, нужно писать, чтобы выйти из кризиса идейного.", author: "Джон Роджерс" },
];

export default function HomePage({ onNavigate }: Props) {
  const { books, loading } = useBooks();
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length];

  const realBooks = books.filter((b) => b.title !== "[удалено]");
  const totalChars = realBooks.reduce((s, b) => s + b.words, 0);
  const recentBooks = realBooks.slice(0, 3);
  const { history } = useGoals(totalChars, realBooks);
  const streak = calcStreak(history);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
      {/* Hero */}
      <section className="mb-14 animate-slide-up">
        <div className="relative overflow-hidden rounded-2xl px-8 py-12 md:py-16"
          style={{ background: 'linear-gradient(135deg, hsl(267 50% 22%) 0%, hsl(270 40% 32%) 100%)' }}>
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          <div className="relative z-10">
            <p className="font-cormorant text-lg italic text-white/60 mb-2">Сегодняшняя мысль</p>
            <blockquote className="font-cormorant text-3xl md:text-4xl font-light text-white leading-snug mb-3">
              «{quote.text}»
            </blockquote>
            {quote.author && (
              <p className="font-lora text-sm text-white/50">— {quote.author}</p>
            )}
          </div>
          <div className="absolute right-8 bottom-6 font-cormorant text-8xl text-white/5 select-none pointer-events-none">✦</div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-2xl font-light text-foreground">Начать новое</h2>
          <span className="ornament text-sm">✦ ✦ ✦</span>
        </div>
        <button onClick={() => onNavigate("books")}
          className="w-full md:w-auto flex items-center gap-3 px-6 py-3.5 rounded-xl font-lora text-sm transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
          <span className="text-lg">✦</span>
          Создать новую книгу
        </button>
      </section>

      {/* Recent books */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-2xl font-light text-foreground">Недавние проекты</h2>
          <button onClick={() => onNavigate("books")}
            className="font-lora text-sm text-violet hover:opacity-80 transition-opacity">
            Все книги →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'hsl(var(--violet) / 0.3)', borderTopColor: 'hsl(var(--violet))' }} />
          </div>
        ) : recentBooks.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border">
            <p className="font-lora text-sm text-muted-foreground mb-3">Пока нет ни одной книги</p>
            <button onClick={() => onNavigate("books")}
              className="font-lora text-sm text-violet hover:opacity-80 transition-opacity">
              Создать первую →
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {recentBooks.map((book) => (
              <button key={book.id} onClick={() => onNavigate("books")}
                className="text-left group p-5 rounded-xl border border-border bg-card hover-lift transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-cormorant text-xl font-medium text-foreground group-hover:text-violet transition-colors">
                      {book.title}
                    </h3>
                    <p className="font-lora text-xs text-muted-foreground mt-0.5">{book.genre || "Жанр не указан"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-lora text-xs text-muted-foreground">{book.words.toLocaleString("ru")} зн.</span>
                  <span className="font-lora text-xs text-muted-foreground">{(book.words / 40000).toFixed(1)} авт. л.</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Stats teaser */}
      <section className="mt-12 space-y-3">
        <button onClick={() => onNavigate("stats")}
          className="w-full flex items-center justify-between px-6 py-4 rounded-xl border border-border bg-card hover-lift transition-all">
          <div className="text-left">
            <div className="font-cormorant text-3xl font-light text-violet leading-none">
              {totalChars.toLocaleString("ru")}
            </div>
            <div className="font-lora text-xs text-muted-foreground mt-1">знаков с пробелами</div>
          </div>
          <div className="text-right">
            <div className="font-cormorant text-2xl font-light text-violet/70 leading-none">
              {(totalChars / 40000).toFixed(1)}
            </div>
            <div className="font-lora text-xs text-muted-foreground mt-1">авт. листов</div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Книг в работе", value: String(realBooks.length) },
            { label: "Дней подряд",   value: String(streak) },
          ].map((stat) => (
            <button key={stat.label} onClick={() => onNavigate("stats")}
              className="text-center p-4 rounded-xl border border-border bg-card hover-lift transition-all">
              <div className="font-cormorant text-3xl font-light text-violet mb-1">{stat.value}</div>
              <div className="font-lora text-xs text-muted-foreground">{stat.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}