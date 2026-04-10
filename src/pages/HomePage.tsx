import { books, totalWords, totalChars } from "@/data/books";

type Page = "home" | "books" | "stats" | "profile" | "help";

interface Props {
  onNavigate: (page: Page) => void;
}

const recentBooks = books;

const quotes = [
  { text: "Писать — значит дышать по-другому.", author: "Маргерит Дюрас" },
  { text: "Книга — это мечта, которую ты держишь в руках.", author: "Нил Гейман" },
  { text: "Начни писать. Страх уйдёт в процессе.", author: "" },
];

export default function HomePage({ onNavigate }: Props) {
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
      {/* Hero */}
      <section className="mb-14 animate-slide-up">
        <div className="relative overflow-hidden rounded-2xl bg-violet-deep px-8 py-12 md:py-16"
          style={{ background: 'linear-gradient(135deg, hsl(267 50% 22%) 0%, hsl(270 40% 32%) 100%)' }}>
          {/* Decorative texture */}
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
          <div className="absolute right-8 bottom-6 font-cormorant text-8xl text-white/5 select-none pointer-events-none">
            ✦
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-12" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-2xl font-light text-foreground">Начать новое</h2>
          <span className="ornament text-sm">✦ ✦ ✦</span>
        </div>
        <button
          onClick={() => onNavigate("books")}
          className="w-full md:w-auto flex items-center gap-3 px-6 py-3.5 rounded-xl font-lora text-sm transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}
        >
          <span className="text-lg">✦</span>
          Создать новую книгу
        </button>
      </section>

      {/* Recent books */}
      <section style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-2xl font-light text-foreground">Недавние проекты</h2>
          <button
            onClick={() => onNavigate("books")}
            className="font-lora text-sm text-violet hover:opacity-80 transition-opacity"
          >
            Все книги →
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {recentBooks.map((book) => (
            <button
              key={book.title}
              onClick={() => onNavigate("books")}
              className="text-left group p-5 rounded-xl border border-border bg-card hover-lift transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-cormorant text-xl font-medium text-foreground group-hover:text-violet transition-colors">
                    {book.title}
                  </h3>
                  <p className="font-lora text-xs text-muted-foreground mt-0.5">{book.genre}</p>
                </div>
                <span className="text-xs font-lora text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {book.lastEdit}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${book.progress}%`,
                      background: 'hsl(var(--violet))'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-lora text-xs text-muted-foreground">
                  {book.words.toLocaleString("ru")} слов
                </span>
                <span className="font-lora text-xs text-violet">{book.progress}%</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Stats teaser */}
      <section className="mt-12 space-y-3">
        {/* Total words across all books */}
        <button
          onClick={() => onNavigate("stats")}
          className="w-full flex items-center justify-between px-6 py-4 rounded-xl border border-border bg-card hover-lift transition-all"
        >
          <div className="text-left">
            <div className="font-cormorant text-3xl font-light text-violet leading-none">
              {totalWords.toLocaleString("ru")}
            </div>
            <div className="font-lora text-xs text-muted-foreground mt-1">слов во всех книгах</div>
          </div>
          <div className="text-right">
            <div className="font-cormorant text-2xl font-light text-violet/70 leading-none">
              {totalChars.toLocaleString("ru")}
            </div>
            <div className="font-lora text-xs text-muted-foreground mt-1">знаков без пробелов</div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Книг в работе", value: String(books.length) },
            { label: "Дней подряд", value: "12" },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => onNavigate("stats")}
              className="text-center p-4 rounded-xl border border-border bg-card hover-lift transition-all"
            >
              <div className="font-cormorant text-3xl font-light text-violet mb-1">{stat.value}</div>
              <div className="font-lora text-xs text-muted-foreground">{stat.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}