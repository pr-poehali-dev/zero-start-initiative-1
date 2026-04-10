import { useState } from "react";
import Icon from "@/components/ui/icon";

type BookTab = "manuscript" | "synopsis" | "characters" | "plan" | "lore";

const TABS: { id: BookTab; label: string; icon: string }[] = [
  { id: "manuscript", label: "Рукопись", icon: "FileText" },
  { id: "synopsis", label: "Синопсис", icon: "AlignLeft" },
  { id: "characters", label: "Персонажи", icon: "Users" },
  { id: "plan", label: "План", icon: "List" },
  { id: "lore", label: "Лор", icon: "Sparkles" },
];

const mockBooks = [
  { id: 1, title: "Осколки неба", genre: "Фэнтези", words: 34210 },
  { id: 2, title: "Письма без адреса", genre: "Современная проза", words: 12750 },
  { id: 3, title: "Сад ночных цветов", genre: "Магический реализм", words: 51800 },
];

export default function BooksPage() {
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<BookTab>("manuscript");
  const [showNewBook, setShowNewBook] = useState(false);

  if (selectedBook !== null) {
    const book = mockBooks.find((b) => b.id === selectedBook)!;
    return <BookDetail book={book} tab={activeTab} onTabChange={setActiveTab} onBack={() => setSelectedBook(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-cormorant text-4xl font-light">Мои книги</h1>
        <button
          onClick={() => setShowNewBook(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-lora text-sm transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Icon name="Plus" size={16} />
          Новая книга
        </button>
      </div>

      {/* Books grid */}
      <div className="grid md:grid-cols-2 gap-5">
        {mockBooks.map((book) => (
          <button
            key={book.id}
            onClick={() => setSelectedBook(book.id)}
            className="text-left group p-6 rounded-xl border border-border bg-card hover-lift transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-14 rounded-md flex-shrink-0 flex items-center justify-center"
                style={{ background: 'hsl(var(--violet-light))' }}>
                <span className="text-violet text-lg">✦</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-cormorant text-xl font-medium group-hover:text-violet transition-colors">
                  {book.title}
                </h3>
                <p className="font-lora text-xs text-muted-foreground mt-0.5 mb-3">{book.genre}</p>
                <p className="font-lora text-sm text-muted-foreground">
                  {book.words.toLocaleString("ru")} слов
                </p>
              </div>
              <Icon name="ChevronRight" size={18} className="text-muted-foreground group-hover:text-violet transition-colors mt-1" />
            </div>
          </button>
        ))}

        {/* New book card */}
        <button
          onClick={() => setShowNewBook(true)}
          className="text-left group p-6 rounded-xl border-2 border-dashed border-border hover:border-violet bg-transparent hover-lift transition-all"
        >
          <div className="flex flex-col items-center justify-center h-20 gap-2">
            <Icon name="PlusCircle" size={24} className="text-muted-foreground group-hover:text-violet transition-colors" />
            <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
              Начать новую книгу
            </span>
          </div>
        </button>
      </div>

      {/* New book modal */}
      {showNewBook && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-md animate-slide-up">
            <h2 className="font-cormorant text-2xl mb-5">Новая книга</h2>
            <div className="space-y-4">
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Название</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none focus:ring-1 focus:ring-violet"
                  placeholder="Моя история..."
                  style={{ '--tw-ring-color': 'hsl(var(--violet))' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Жанр</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none focus:ring-1"
                  placeholder="Фэнтези, проза, детектив..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewBook(false)}
                className="flex-1 py-2.5 rounded-lg border border-border font-lora text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowNewBook(false)}
                className="flex-1 py-2.5 rounded-lg font-lora text-sm transition-all"
                style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookDetail({
  book,
  tab,
  onTabChange,
  onBack,
}: {
  book: { id: number; title: string; genre: string; words: number };
  tab: BookTab;
  onTabChange: (t: BookTab) => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-24 md:pb-10 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <Icon name="ArrowLeft" size={16} />
        Все книги
      </button>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-10 h-14 rounded-md flex-shrink-0 flex items-center justify-center"
          style={{ background: 'hsl(var(--violet-light))' }}>
          <span className="text-violet">✦</span>
        </div>
        <div>
          <h1 className="font-cormorant text-4xl font-light leading-tight">{book.title}</h1>
          <p className="font-lora text-sm text-muted-foreground mt-1">{book.genre} · {book.words.toLocaleString("ru")} слов</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-7 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-lora text-xs whitespace-nowrap transition-all ${
              tab === t.id
                ? "text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={tab === t.id ? { background: 'hsl(var(--violet))' } : {}}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={tab}>
        {tab === "manuscript" && <ManuscriptTab />}
        {tab === "synopsis" && <SynopsisTab />}
        {tab === "characters" && <CharactersTab />}
        {tab === "plan" && <PlanTab />}
        {tab === "lore" && <LoreTab />}
      </div>
    </div>
  );
}

function ManuscriptTab() {
  const [text, setText] = useState(`Глава 1. Начало пути\n\nВетер принёс запах дождя раньше, чем первые капли коснулись брусчатки. Эля подняла голову и увидела, как небо над шпилями башен темнеет — стремительно, почти враждебно.\n\nОна успела добежать до арки только наполовину...`);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const chapters = text.split(/Глава\s+\d+/gi).length - 1 || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <span className="font-lora text-sm text-muted-foreground">{wordCount.toLocaleString("ru")} слов</span>
          <span className="font-lora text-sm text-muted-foreground">{chapters} {chapters === 1 ? 'глава' : 'главы'}</span>
        </div>
        <button className="font-lora text-xs text-violet hover:opacity-80 transition-opacity">
          Загрузить файл
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-96 border border-border rounded-xl px-5 py-4 font-lora text-sm leading-7 bg-card resize-none focus:outline-none focus:ring-1 scroll-custom"
        style={{ '--tw-ring-color': 'hsl(var(--violet))' } as React.CSSProperties}
        placeholder="Начните вашу историю..."
      />
    </div>
  );
}

function SynopsisTab() {
  const [synopsis, setSynopsis] = useState("");

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Sparkles" size={15} className="text-violet" />
          <span className="font-lora text-sm font-medium">Автогенерация синопсиса</span>
        </div>
        <p className="font-lora text-xs text-muted-foreground mb-3">
          На основе вашей рукописи ИИ составит синопсис по профессиональным правилам.
        </p>
        <button
          className="px-4 py-2 rounded-lg font-lora text-xs transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}
        >
          Сгенерировать синопсис
        </button>
      </div>
      <textarea
        value={synopsis}
        onChange={(e) => setSynopsis(e.target.value)}
        className="w-full h-64 border border-border rounded-xl px-5 py-4 font-lora text-sm leading-7 bg-card resize-none focus:outline-none focus:ring-1 scroll-custom"
        placeholder="Синопсис вашей книги..."
      />
    </div>
  );
}

function CharactersTab() {
  const characters = [
    { name: "Эля", role: "Главный герой", description: "Молодая картографиня с даром видеть скрытые пути" },
    { name: "Лорд Кейн", role: "Антагонист", description: "Архивариус Башни, хранящий запрещённые карты" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {characters.map((c) => (
          <div key={c.name} className="p-5 rounded-xl border border-border bg-card hover-lift transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-cormorant font-medium"
                style={{ background: 'hsl(var(--violet-light))', color: 'hsl(var(--violet))' }}>
                {c.name[0]}
              </div>
              <div>
                <h3 className="font-cormorant text-lg font-medium">{c.name}</h3>
                <p className="font-lora text-xs text-muted-foreground">{c.role}</p>
              </div>
            </div>
            <p className="font-lora text-sm text-muted-foreground">{c.description}</p>
          </div>
        ))}
        <button className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-24">
          <Icon name="UserPlus" size={20} className="text-muted-foreground group-hover:text-violet transition-colors" />
          <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
            Добавить персонажа
          </span>
        </button>
      </div>
    </div>
  );
}

function PlanTab() {
  const episodes = [
    { num: 1, title: "Первая встреча с Башней", status: "done" },
    { num: 2, title: "Архив запрещённых карт", status: "done" },
    { num: 3, title: "Побег через подземелья", status: "current" },
    { num: 4, title: "Союз с Кейном", status: "pending" },
    { num: 5, title: "Развязка у Северных врат", status: "pending" },
  ];

  return (
    <div className="space-y-2">
      {episodes.map((ep) => (
        <div
          key={ep.num}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover-lift transition-all"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-lora flex-shrink-0 ${
            ep.status === "done" ? "text-white" :
            ep.status === "current" ? "border-2" : "border border-border text-muted-foreground"
          }`}
            style={
              ep.status === "done" ? { background: 'hsl(var(--violet))' } :
              ep.status === "current" ? { borderColor: 'hsl(var(--violet))', color: 'hsl(var(--violet))' } : {}
            }
          >
            {ep.status === "done" ? "✓" : ep.num}
          </div>
          <span className={`font-lora text-sm ${
            ep.status === "pending" ? "text-muted-foreground" : "text-foreground"
          }`}>
            {ep.title}
          </span>
        </div>
      ))}
      <button className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex items-center justify-center gap-2 mt-2">
        <Icon name="Plus" size={16} className="text-muted-foreground group-hover:text-violet transition-colors" />
        <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
          Добавить эпизод
        </span>
      </button>
    </div>
  );
}

function LoreTab() {
  const notes = [
    { title: "Башня Архива", tag: "Места", text: "Семиэтажная башня в центре Старого города. На верхнем этаже хранятся запрещённые карты..." },
    { title: "Система магии", tag: "Магия", text: "Картографическая магия позволяет видеть скрытые пути между мирами..." },
  ];

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div key={note.title} className="p-5 rounded-xl border border-border bg-card hover-lift transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-lora text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'hsl(var(--violet-light))', color: 'hsl(var(--violet))' }}>
                {note.tag}
              </span>
            </div>
            <h3 className="font-cormorant text-lg font-medium mb-1">{note.title}</h3>
            <p className="font-lora text-sm text-muted-foreground">{note.text}</p>
          </div>
        ))}
        <button className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-24">
          <Icon name="FilePlus" size={20} className="text-muted-foreground group-hover:text-violet transition-colors" />
          <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
            Новая заметка
          </span>
        </button>
      </div>
    </div>
  );
}
