import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const SYNOPSIS_ANALYZE_URL = "https://functions.poehali.dev/da1e9eb2-38d0-4305-984a-1a415b74a4fb";

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

interface SynopsisIssue {
  rule: string;
  problem: string;
  suggestion: string;
}

interface SynopsisAnalysis {
  overall: string;
  strengths: string[];
  issues: SynopsisIssue[];
  score: number;
}

function SynopsisTab() {
  const [synopsis, setSynopsis] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SynopsisAnalysis | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSynopsis(ev.target?.result as string ?? "");
    reader.readAsText(file, "utf-8");
  };

  const analyze = async () => {
    if (!synopsis.trim()) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch(SYNOPSIS_ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ synopsis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setAnalysis(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось выполнить анализ");
    } finally {
      setLoading(false);
    }
  };

  const wordCount = synopsis.trim().split(/\s+/).filter(Boolean).length;
  const charCount = synopsis.replace(/\s/g, "").length;

  return (
    <div className="space-y-5">
      {/* Editor */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
          <div className="flex gap-4">
            <span className="font-lora text-xs text-muted-foreground">{wordCount} слов</span>
            <span className="font-lora text-xs text-muted-foreground">{charCount} знаков</span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="Upload" size={13} />
            Загрузить файл
            <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} />
          </button>
        </div>
        <textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          className="w-full h-64 px-5 py-4 font-lora text-sm leading-7 bg-card resize-none focus:outline-none scroll-custom"
          placeholder="Напишите или вставьте синопсис вашей книги..."
        />
      </div>

      {/* Analyze button */}
      {synopsis.trim().length > 50 && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-lora text-sm transition-all hover-lift disabled:opacity-60"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Анализирую...
            </>
          ) : (
            <>
              <Icon name="Sparkles" size={16} />
              Проверить синопсис по правилам
            </>
          )}
        </button>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 font-lora text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="space-y-4 animate-slide-up">
          {/* Score + overall */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                style={{ background: 'hsl(var(--violet-light))' }}>
                <span className="font-cormorant text-2xl font-medium text-violet">{analysis.score}</span>
                <span className="font-lora text-[10px] text-muted-foreground">/ 10</span>
              </div>
              <div>
                <p className="font-lora text-sm leading-relaxed text-foreground">{analysis.overall}</p>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="ThumbsUp" size={15} className="text-violet" />
                <span className="font-lora text-sm font-medium">Что хорошо</span>
              </div>
              <ul className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-violet mt-0.5 flex-shrink-0">✦</span>
                    <span className="font-lora text-sm text-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {analysis.issues?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Icon name="AlertCircle" size={15} className="text-muted-foreground" />
                <span className="font-lora text-sm font-medium">Что улучшить</span>
              </div>
              {analysis.issues.map((issue, i) => (
                <div key={i} className="p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-lora text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'hsl(var(--violet-light))', color: 'hsl(var(--violet))' }}>
                      {issue.rule}
                    </span>
                  </div>
                  <p className="font-lora text-sm text-foreground mb-2">{issue.problem}</p>
                  <p className="font-lora text-sm text-muted-foreground border-l-2 pl-3"
                    style={{ borderColor: 'hsl(var(--violet) / 0.4)' }}>
                    {issue.suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// CHARACTERS TAB
// ──────────────────────────────────────────────

interface Character {
  id: number;
  name: string;
  role: string;
  photo: string | null;
  freeText: string;
  questionnaire: Record<string, string>;
}

const QUESTIONNAIRE_FIELDS = [
  { key: "fullname",     label: "Полное имя / псевдоним" },
  { key: "age",          label: "Возраст и дата рождения" },
  { key: "appearance",   label: "Внешность (рост, телосложение, особые черты)" },
  { key: "personality",  label: "Характер и темперамент" },
  { key: "background",   label: "История / прошлое" },
  { key: "family",       label: "Семья и близкие" },
  { key: "motivation",   label: "Главная цель / мотивация" },
  { key: "fear",         label: "Главный страх" },
  { key: "secret",       label: "Тайна, которую скрывает" },
  { key: "speech",       label: "Манера речи и любимые выражения" },
  { key: "habits",       label: "Привычки и странности" },
  { key: "skills",       label: "Способности и таланты" },
  { key: "weakness",     label: "Слабости и уязвимости" },
  { key: "relationships", label: "Отношения с другими героями" },
  { key: "arc",          label: "Как меняется по ходу истории" },
];

const ROLE_COLORS: Record<string, string> = {
  "Главный герой":  "hsl(267 45% 38%)",
  "Антагонист":     "hsl(0 55% 45%)",
  "Союзник":        "hsl(150 40% 38%)",
  "Второстепенный": "hsl(210 40% 45%)",
};

const DEFAULT_CHARS: Character[] = [
  {
    id: 1,
    name: "Эля",
    role: "Главный герой",
    photo: null,
    freeText: "Молодая картографиня с даром видеть скрытые пути между мирами.",
    questionnaire: {
      fullname: "Элеонора Вэйн",
      age: "22 года",
      motivation: "Найти исчезнувшего отца и разгадать тайну запрещённых карт",
      fear: "Потерять дар и снова стать обычным человеком",
    },
  },
  {
    id: 2,
    name: "Лорд Кейн",
    role: "Антагонист",
    photo: null,
    freeText: "Архивариус Башни, хранящий запрещённые карты. Холоден, методичен, убеждён в своей правоте.",
    questionnaire: {
      fullname: "Кейн Аш-Дарей",
      age: "54 года",
      motivation: "Сохранить порядок любой ценой, не дать магии выйти за пределы Башни",
    },
  },
];

function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>(DEFAULT_CHARS);
  const [view, setView] = useState<"list" | "card" | "questionnaire">("list");
  const [selected, setSelected] = useState<Character | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Character | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Главный герой");

  const openCard = (c: Character, v: "card" | "questionnaire") => {
    setSelected(c);
    setDraft({ ...c, questionnaire: { ...c.questionnaire } });
    setView(v);
    setEditing(false);
  };

  const saveEdits = () => {
    if (!draft) return;
    setCharacters((prev) => prev.map((c) => (c.id === draft.id ? draft : c)));
    setSelected(draft);
    setEditing(false);
  };

  const createCharacter = () => {
    if (!newName.trim()) return;
    const nc: Character = {
      id: Date.now(),
      name: newName.trim(),
      role: newRole,
      photo: null,
      freeText: "",
      questionnaire: {},
    };
    setCharacters((prev) => [...prev, nc]);
    setShowNew(false);
    setNewName("");
    openCard(nc, "card");
    setEditing(true);
  };

  const deleteCharacter = (id: number) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setView("list");
    setSelected(null);
  };

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid md:grid-cols-2 gap-4">
          {characters.map((c) => {
            const color = ROLE_COLORS[c.role] ?? "hsl(var(--violet))";
            return (
              <div key={c.id} className="group p-5 rounded-xl border border-border bg-card hover-lift transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-cormorant text-lg font-medium text-white flex-shrink-0"
                    style={{ background: color }}>
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cormorant text-lg font-medium leading-tight">{c.name}</h3>
                    <span className="font-lora text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                      style={{ background: `${color}22`, color }}>
                      {c.role}
                    </span>
                  </div>
                </div>
                {c.freeText && (
                  <p className="font-lora text-sm text-muted-foreground mb-3 line-clamp-2">{c.freeText}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => openCard(c, "card")}
                    className="flex-1 py-1.5 rounded-lg border border-border font-lora text-xs text-muted-foreground hover:text-foreground hover:border-violet/50 transition-colors">
                    Карточка
                  </button>
                  <button onClick={() => openCard(c, "questionnaire")}
                    className="flex-1 py-1.5 rounded-lg border border-border font-lora text-xs text-muted-foreground hover:text-foreground hover:border-violet/50 transition-colors">
                    Анкета
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add new */}
          <button onClick={() => setShowNew(true)}
            className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-32">
            <Icon name="UserPlus" size={22} className="text-muted-foreground group-hover:text-violet transition-colors" />
            <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
              Добавить персонажа
            </span>
          </button>
        </div>

        {/* New character modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-sm animate-slide-up">
              <h2 className="font-cormorant text-2xl mb-5">Новый персонаж</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-lora text-sm text-muted-foreground block mb-1.5">Имя</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none focus:ring-1"
                    placeholder="Имя персонажа..." autoFocus />
                </div>
                <div>
                  <label className="font-lora text-sm text-muted-foreground block mb-1.5">Роль</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none">
                    {Object.keys(ROLE_COLORS).map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border font-lora text-sm text-muted-foreground hover:bg-muted transition-colors">
                  Отмена
                </button>
                <button onClick={createCharacter}
                  className="flex-1 py-2.5 rounded-lg font-lora text-sm transition-all"
                  style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!selected || !draft) return null;
  const color = ROLE_COLORS[selected.role] ?? "hsl(var(--violet))";
  const filled = QUESTIONNAIRE_FIELDS.filter((f) => draft.questionnaire[f.key]?.trim()).length;

  // ── CARD / QUESTIONNAIRE DETAIL VIEW ──
  return (
    <div className="animate-fade-in">
      {/* Back */}
      <button onClick={() => setView("list")}
        className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <Icon name="ArrowLeft" size={15} />
        Все персонажи
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-cormorant text-2xl font-medium text-white flex-shrink-0"
          style={{ background: color }}>
          {selected.name[0]}
        </div>
        <div className="flex-1">
          <h2 className="font-cormorant text-3xl font-light">{selected.name}</h2>
          <span className="font-lora text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, color }}>
            {selected.role}
          </span>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Pencil" size={13} />
              Изменить
            </button>
          )}
          {editing && (
            <button onClick={saveEdits}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-lora text-xs text-white transition-colors"
              style={{ background: 'hsl(var(--violet))' }}>
              <Icon name="Check" size={13} />
              Сохранить
            </button>
          )}
          <button onClick={() => deleteCharacter(selected.id)}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
            <Icon name="Trash2" size={13} />
          </button>
        </div>
      </div>

      {/* Sub-tabs: Карточка / Анкета */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
        {(["card", "questionnaire"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg font-lora text-xs transition-all ${
              view === v ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            style={view === v ? { background: 'hsl(var(--violet))' } : {}}>
            {v === "card" ? "Карточка" : `Анкета · ${filled}/${QUESTIONNAIRE_FIELDS.length}`}
          </button>
        ))}
      </div>

      {/* CARD */}
      {view === "card" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            {/* Photo upload */}
            <div className="flex items-start gap-5 mb-5">
              <div className="flex-shrink-0">
                {draft.photo ? (
                  <div className="relative group w-24 h-32 rounded-xl overflow-hidden border border-border">
                    <img src={draft.photo} alt={draft.name} className="w-full h-full object-cover" />
                    {editing && (
                      <button
                        onClick={() => setDraft({ ...draft, photo: null })}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Icon name="Trash2" size={16} className="text-white" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className={`w-24 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${editing ? "border-border hover:border-violet" : "border-border"}`}>
                    {editing && (
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => setDraft({ ...draft, photo: ev.target?.result as string });
                          reader.readAsDataURL(file);
                        }} />
                    )}
                    <Icon name="ImagePlus" size={20} className={editing ? "text-muted-foreground" : "text-muted-foreground/40"} />
                    {editing && <span className="font-lora text-[10px] text-muted-foreground text-center leading-tight px-1">Загрузить фото</span>}
                  </label>
                )}
              </div>
              <div className="flex-1">
                <label className="font-lora text-xs text-muted-foreground block mb-2">Свободное описание</label>
                {editing ? (
                  <textarea value={draft.freeText} onChange={(e) => setDraft({ ...draft, freeText: e.target.value })}
                    rows={5}
                    className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background resize-none focus:outline-none focus:ring-1 scroll-custom"
                    placeholder="Всё, что важно знать об этом персонаже..." />
                ) : (
                  <p className="font-lora text-sm leading-7 whitespace-pre-wrap text-foreground">
                    {selected.freeText || <span className="text-muted-foreground italic">Описание не заполнено</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick questionnaire preview */}
          {QUESTIONNAIRE_FIELDS.filter((f) => draft.questionnaire[f.key]).length > 0 && (
            <div className="p-5 rounded-xl border border-border bg-muted/30">
              <p className="font-lora text-xs text-muted-foreground mb-3">Из анкеты</p>
              <div className="space-y-2">
                {QUESTIONNAIRE_FIELDS.filter((f) => draft.questionnaire[f.key]).slice(0, 4).map((f) => (
                  <div key={f.key} className="flex gap-3">
                    <span className="font-lora text-xs text-muted-foreground w-32 flex-shrink-0">{f.label}:</span>
                    <span className="font-lora text-xs text-foreground">{draft.questionnaire[f.key]}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setView("questionnaire")} className="font-lora text-xs text-violet mt-3 hover:opacity-80 transition-opacity">
                Вся анкета →
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUESTIONNAIRE — школьный альбом */}
      {view === "questionnaire" && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--violet) / 0.3)' }}>

          {/* Шапка — всегда фиолетовая */}
          <div className="px-7 py-6" style={{ background: 'linear-gradient(135deg, hsl(267 50% 30%) 0%, hsl(267 45% 42%) 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Фото или инициал в шапке */}
                {(draft.photo || selected.photo) ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                    <img src={draft.photo ?? selected.photo ?? ""} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center font-cormorant text-2xl text-white/80 flex-shrink-0">
                    {selected.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-cormorant text-sm italic text-white/60 mb-0.5">Досье персонажа</p>
                  <h3 className="font-cormorant text-2xl font-light text-white">{selected.name}</h3>
                  <span className="font-lora text-xs text-white/60">{selected.role}</span>
                </div>
              </div>
              <div className="font-cormorant text-5xl text-white/10 select-none">✦</div>
            </div>
            {/* Progress */}
            <div className="mt-5">
              <div className="flex justify-between font-lora text-xs text-white/50 mb-1.5">
                <span>Заполнено</span>
                <span>{filled} из {QUESTIONNAIRE_FIELDS.length}</span>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full transition-all"
                  style={{ width: `${(filled / QUESTIONNAIRE_FIELDS.length) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Поля анкеты */}
          <div className="bg-card divide-y divide-border">
            {QUESTIONNAIRE_FIELDS.map((field, i) => (
              <div key={field.key} className="grid grid-cols-[1.5rem_10rem_1fr] items-center gap-3 px-6 py-3">
                <span className="font-lora text-xs text-center flex-shrink-0"
                  style={{ color: 'hsl(var(--violet) / 0.5)' }}>
                  {i + 1}
                </span>
                <span className="font-lora text-xs text-muted-foreground leading-tight">
                  {field.label}
                </span>
                {editing ? (
                  <input
                    value={draft.questionnaire[field.key] ?? ""}
                    onChange={(e) => setDraft({
                      ...draft,
                      questionnaire: { ...draft.questionnaire, [field.key]: e.target.value }
                    })}
                    className="font-lora text-sm bg-transparent focus:outline-none border-b border-border focus:border-violet/50 transition-colors py-0.5 w-full"
                    placeholder="..."
                  />
                ) : (
                  <span className={`font-lora text-sm ${
                    draft.questionnaire[field.key] ? "text-foreground" : "text-muted-foreground/30 italic"
                  }`}>
                    {draft.questionnaire[field.key] || "—"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border flex justify-between items-center bg-muted/20">
            <span className="font-cormorant text-xs italic text-muted-foreground">Скрипторий · Анкета персонажа</span>
            <span className="font-lora text-xs text-muted-foreground">{new Date().getFullYear()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// PLAN TAB
// ──────────────────────────────────────────────

interface PlanEpisode {
  id: number;
  title: string;
  description: string;
  done: boolean;
}

interface PlanSection {
  id: string;
  label: string;
  subtitle: string;
  color: string;
  episodes: PlanEpisode[];
}

const PLAN_SECTIONS_DEFAULT: PlanSection[] = [
  { id: "beginning", label: "Начало",          subtitle: "Завязка, мир, герой, конфликт",                    color: "hsl(210 55% 44%)", episodes: [
    { id: 1, title: "Первая встреча с Башней", description: "Эля приходит в Башню за картой отца и сталкивается с охраной.", done: true },
  ]},
  { id: "development", label: "Развитие",       subtitle: "Осложнения, напряжение, новые цели",               color: "hsl(267 45% 42%)", episodes: [
    { id: 2, title: "Архив запрещённых карт",  description: "Эля проникает на верхний этаж и обнаруживает тайник отца.", done: true },
    { id: 3, title: "Побег через подземелья",  description: "Охрана раскрыта, Эля вынуждена бежать.", done: false },
  ]},
  { id: "turning",     label: "Поворот",         subtitle: "Точка невозврата",                                 color: "hsl(30 60% 44%)",  episodes: [] },
  { id: "climax",      label: "Кульминация",      subtitle: "Главный выбор, финальное сражение, пик",           color: "hsl(0 50% 46%)",   episodes: [] },
  { id: "resolution",  label: "Развязка",         subtitle: "Последствия, финальная сцена",                     color: "hsl(150 40% 38%)", episodes: [] },
];

function PlanTab() {
  const [sections, setSections] = useState<PlanSection[]>(PLAN_SECTIONS_DEFAULT);
  const [editingEp, setEditingEp] = useState<{ sectionId: string; ep: PlanEpisode } | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const totalEps = sections.reduce((s, sec) => s + sec.episodes.length, 0);
  const doneEps  = sections.reduce((s, sec) => s + sec.episodes.filter((e) => e.done).length, 0);

  const toggleDone = (sectionId: string, epId: number) => {
    setSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : {
        ...sec,
        episodes: sec.episodes.map((e) => e.id === epId ? { ...e, done: !e.done } : e),
      }
    ));
  };

  const addEpisode = (sectionId: string) => {
    if (!newTitle.trim()) return;
    const ep: PlanEpisode = { id: Date.now(), title: newTitle.trim(), description: newDesc.trim(), done: false };
    setSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : { ...sec, episodes: [...sec.episodes, ep] }
    ));
    setAddingTo(null);
    setNewTitle(""); setNewDesc("");
  };

  const saveEdit = () => {
    if (!editingEp) return;
    setSections(sections.map((sec) =>
      sec.id !== editingEp.sectionId ? sec : {
        ...sec,
        episodes: sec.episodes.map((e) => e.id === editingEp.ep.id ? editingEp.ep : e),
      }
    ));
    setEditingEp(null);
  };

  const deleteEp = (sectionId: string, epId: number) => {
    setSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : { ...sec, episodes: sec.episodes.filter((e) => e.id !== epId) }
    ));
    setEditingEp(null);
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-3 px-1 mb-1">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${totalEps ? (doneEps / totalEps) * 100 : 0}%`, background: 'hsl(var(--violet))' }} />
        </div>
        <span className="font-lora text-xs text-muted-foreground">{doneEps} / {totalEps} эпизодов</span>
      </div>

      {/* Sections */}
      {sections.map((sec) => (
        <div key={sec.id} className="rounded-xl border border-border overflow-hidden">
          {/* Section header */}
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ background: `${sec.color}14`, borderBottom: `1px solid ${sec.color}30` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sec.color }} />
            <div className="flex-1 min-w-0">
              <span className="font-cormorant text-base font-medium" style={{ color: sec.color }}>{sec.label}</span>
              <span className="font-lora text-xs text-muted-foreground ml-2">{sec.subtitle}</span>
            </div>
            <span className="font-lora text-xs text-muted-foreground">
              {sec.episodes.filter((e) => e.done).length}/{sec.episodes.length}
            </span>
          </div>

          {/* Episodes table */}
          {sec.episodes.length > 0 && (
            <div className="divide-y divide-border">
              {/* Column headers */}
              <div className="grid grid-cols-[2rem_1fr_2fr_5rem] gap-3 px-4 py-2 bg-muted/30">
                <div />
                <span className="font-lora text-[11px] text-muted-foreground uppercase tracking-wide">Название</span>
                <span className="font-lora text-[11px] text-muted-foreground uppercase tracking-wide">Описание</span>
                <div />
              </div>
              {sec.episodes.map((ep) => (
                <div key={ep.id}
                  className={`grid grid-cols-[2rem_1fr_2fr_5rem] gap-3 px-4 py-3 items-start transition-colors ${ep.done ? "bg-muted/20" : "bg-card"}`}>
                  {/* Checkbox */}
                  <button onClick={() => toggleDone(sec.id, ep.id)}
                    className="mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                    style={ep.done
                      ? { background: sec.color, borderColor: sec.color }
                      : { borderColor: `${sec.color}60` }}>
                    {ep.done && <Icon name="Check" size={11} className="text-white" />}
                  </button>

                  {/* Title */}
                  <span className={`font-lora text-sm leading-snug ${ep.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {ep.title}
                  </span>

                  {/* Description */}
                  <span className="font-lora text-sm text-muted-foreground leading-snug">
                    {ep.description || <span className="italic text-muted-foreground/40">—</span>}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditingEp({ sectionId: sec.id, ep: { ...ep } })}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Icon name="Pencil" size={12} />
                    </button>
                    <button onClick={() => deleteEp(sec.id, ep.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                      <Icon name="Trash2" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add episode row */}
          {addingTo === sec.id ? (
            <div className="px-4 py-3 bg-muted/10 border-t border-border space-y-2">
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 font-lora text-sm bg-background focus:outline-none focus:ring-1"
                  placeholder="Название эпизода..." autoFocus />
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEpisode(sec.id)}
                  className="border border-border rounded-lg px-3 py-2 font-lora text-sm bg-background focus:outline-none focus:ring-1"
                  placeholder="Краткое описание..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => addEpisode(sec.id)}
                  className="px-4 py-1.5 rounded-lg font-lora text-xs text-white transition-all"
                  style={{ background: sec.color }}>
                  Добавить
                </button>
                <button onClick={() => { setAddingTo(null); setNewTitle(""); setNewDesc(""); }}
                  className="px-4 py-1.5 rounded-lg font-lora text-xs border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setAddingTo(sec.id); setNewTitle(""); setNewDesc(""); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors border-t border-border group">
              <Icon name="Plus" size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="font-lora text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Добавить эпизод
              </span>
            </button>
          )}
        </div>
      ))}

      {/* Edit episode modal */}
      {editingEp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-md animate-slide-up">
            <h2 className="font-cormorant text-2xl mb-5">Редактировать эпизод</h2>
            <div className="space-y-4">
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Название</label>
                <input value={editingEp.ep.title}
                  onChange={(e) => setEditingEp({ ...editingEp, ep: { ...editingEp.ep, title: e.target.value } })}
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none" />
              </div>
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Описание</label>
                <textarea value={editingEp.ep.description}
                  onChange={(e) => setEditingEp({ ...editingEp, ep: { ...editingEp.ep, description: e.target.value } })}
                  rows={4}
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background resize-none focus:outline-none scroll-custom" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingEp(null)}
                className="flex-1 py-2.5 rounded-lg border border-border font-lora text-sm text-muted-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
              <button onClick={saveEdit}
                className="flex-1 py-2.5 rounded-lg font-lora text-sm text-white transition-all"
                style={{ background: 'hsl(var(--violet))' }}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// LORE TAB
// ──────────────────────────────────────────────

interface LoreTag {
  id: number;
  label: string;
  color: string;
}

interface LoreNote {
  id: number;
  title: string;
  tagId: number;
  text: string;
}

const TAG_PALETTE = [
  "hsl(267 45% 42%)",
  "hsl(210 55% 42%)",
  "hsl(150 45% 36%)",
  "hsl(30 60% 42%)",
  "hsl(0 50% 44%)",
  "hsl(190 50% 38%)",
  "hsl(330 45% 42%)",
];

const DEFAULT_TAGS: LoreTag[] = [
  { id: 1, label: "Места",  color: TAG_PALETTE[1] },
  { id: 2, label: "Магия",  color: TAG_PALETTE[0] },
  { id: 3, label: "История", color: TAG_PALETTE[3] },
];

const DEFAULT_NOTES: LoreNote[] = [
  { id: 1, title: "Башня Архива",  tagId: 1, text: "Семиэтажная башня в центре Старого города. На верхнем этаже хранятся запрещённые карты. Вход — только для архивариусов с третьим уровнем допуска." },
  { id: 2, title: "Система магии", tagId: 2, text: "Картографическая магия позволяет видеть скрытые пути между мирами. Появляется у одного из тысячи людей, обычно в подростковом возрасте." },
];

function LoreTab() {
  const [tags, setTags] = useState<LoreTag[]>(DEFAULT_TAGS);
  const [notes, setNotes] = useState<LoreNote[]>(DEFAULT_NOTES);
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<LoreNote | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState<LoreNote | null>(null);

  // tag management
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState("");

  // new note
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteTag, setNewNoteTag] = useState<number>(tags[0]?.id ?? 1);

  const filtered = activeTag ? notes.filter((n) => n.tagId === activeTag) : notes;

  const tagById = (id: number) => tags.find((t) => t.id === id);

  const addTag = () => {
    if (!newTagLabel.trim()) return;
    const color = TAG_PALETTE[tags.length % TAG_PALETTE.length];
    setTags([...tags, { id: Date.now(), label: newTagLabel.trim(), color }]);
    setNewTagLabel("");
  };

  const saveTagEdit = (id: number) => {
    if (!editingTagLabel.trim()) return;
    setTags(tags.map((t) => t.id === id ? { ...t, label: editingTagLabel.trim() } : t));
    setEditingTagId(null);
  };

  const deleteTag = (id: number) => {
    setTags(tags.filter((t) => t.id !== id));
    if (activeTag === id) setActiveTag(null);
  };

  const createNote = () => {
    if (!newNoteTitle.trim()) return;
    const n: LoreNote = { id: Date.now(), title: newNoteTitle.trim(), tagId: newNoteTag, text: "" };
    setNotes([...notes, n]);
    setShowNewNote(false);
    setNewNoteTitle("");
    openNoteDetail(n, true);
  };

  const openNoteDetail = (n: LoreNote, startEditing = false) => {
    setOpenNote(n);
    setNoteDraft({ ...n });
    setEditingNote(startEditing);
  };

  const saveNote = () => {
    if (!noteDraft) return;
    setNotes(notes.map((n) => n.id === noteDraft.id ? noteDraft : n));
    setOpenNote(noteDraft);
    setEditingNote(false);
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter((n) => n.id !== id));
    setOpenNote(null);
  };

  // ── NOTE DETAIL ──
  if (openNote && noteDraft) {
    const tag = tagById(openNote.tagId);
    return (
      <div className="animate-fade-in">
        <button onClick={() => setOpenNote(null)}
          className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <Icon name="ArrowLeft" size={15} />
          Все заметки
        </button>

        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex-1">
            {editingNote ? (
              <input value={noteDraft.title}
                onChange={(e) => setNoteDraft({ ...noteDraft, title: e.target.value })}
                className="font-cormorant text-3xl font-light bg-transparent border-b border-border focus:outline-none focus:border-violet w-full pb-1"
              />
            ) : (
              <h2 className="font-cormorant text-3xl font-light">{openNote.title}</h2>
            )}
            {tag && (
              <div className="mt-2">
                {editingNote ? (
                  <select value={noteDraft.tagId}
                    onChange={(e) => setNoteDraft({ ...noteDraft, tagId: Number(e.target.value) })}
                    className="font-lora text-xs bg-transparent border border-border rounded-full px-3 py-1 focus:outline-none">
                    {tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                ) : (
                  <span className="font-lora text-xs px-3 py-1 rounded-full"
                    style={{ background: `${tag.color}22`, color: tag.color }}>
                    {tag.label}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!editingNote ? (
              <button onClick={() => setEditingNote(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Pencil" size={13} />
                Изменить
              </button>
            ) : (
              <button onClick={saveNote}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-lora text-xs text-white transition-colors"
                style={{ background: 'hsl(var(--violet))' }}>
                <Icon name="Check" size={13} />
                Сохранить
              </button>
            )}
            <button onClick={() => deleteNote(openNote.id)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
              <Icon name="Trash2" size={13} />
            </button>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card min-h-48">
          {editingNote ? (
            <textarea value={noteDraft.text}
              onChange={(e) => setNoteDraft({ ...noteDraft, text: e.target.value })}
              rows={12}
              className="w-full bg-transparent font-lora text-sm leading-7 resize-none focus:outline-none scroll-custom"
              placeholder="Текст заметки..." />
          ) : (
            <p className="font-lora text-sm leading-7 whitespace-pre-wrap text-foreground">
              {openNote.text || <span className="text-muted-foreground italic">Заметка пуста</span>}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Tags row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTag(null)}
          className={`font-lora text-xs px-3 py-1.5 rounded-full border transition-all ${
            activeTag === null
              ? "border-transparent text-white"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
          style={activeTag === null ? { background: 'hsl(var(--violet))' } : {}}>
          Все
        </button>
        {tags.map((t) => (
          <button key={t.id}
            onClick={() => setActiveTag(activeTag === t.id ? null : t.id)}
            className="font-lora text-xs px-3 py-1.5 rounded-full border transition-all"
            style={activeTag === t.id
              ? { background: t.color, color: "#fff", borderColor: t.color }
              : { background: `${t.color}18`, color: t.color, borderColor: `${t.color}44` }
            }>
            {t.label}
          </button>
        ))}
        <button onClick={() => setShowTagManager(true)}
          className="font-lora text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-violet/50 transition-all flex items-center gap-1">
          <Icon name="Tag" size={11} />
          Ярлыки
        </button>
      </div>

      {/* Notes grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((note) => {
          const tag = tagById(note.tagId);
          return (
            <button key={note.id}
              onClick={() => openNoteDetail(note)}
              className="text-left group p-5 rounded-xl border border-border bg-card hover-lift transition-all">
              {tag && (
                <span className="font-lora text-xs px-2 py-0.5 rounded-full mb-2 inline-block"
                  style={{ background: `${tag.color}22`, color: tag.color }}>
                  {tag.label}
                </span>
              )}
              <h3 className="font-cormorant text-lg font-medium mb-1 group-hover:text-violet transition-colors">
                {note.title}
              </h3>
              <p className="font-lora text-sm text-muted-foreground line-clamp-2">{note.text}</p>
            </button>
          );
        })}

        <button onClick={() => setShowNewNote(true)}
          className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-24">
          <Icon name="FilePlus" size={20} className="text-muted-foreground group-hover:text-violet transition-colors" />
          <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
            Новая заметка
          </span>
        </button>
      </div>

      {/* ── TAG MANAGER MODAL ── */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-cormorant text-2xl">Ярлыки</h2>
              <button onClick={() => setShowTagManager(false)}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto scroll-custom">
              {tags.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  {editingTagId === t.id ? (
                    <>
                      <input value={editingTagLabel}
                        onChange={(e) => setEditingTagLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveTagEdit(t.id)}
                        className="flex-1 border border-border rounded-md px-2 py-1 font-lora text-sm bg-background focus:outline-none"
                        autoFocus />
                      <button onClick={() => saveTagEdit(t.id)}
                        className="text-violet hover:opacity-70 transition-opacity">
                        <Icon name="Check" size={14} />
                      </button>
                      <button onClick={() => setEditingTagId(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name="X" size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-lora text-sm">{t.label}</span>
                      <button onClick={() => { setEditingTagId(t.id); setEditingTagLabel(t.label); }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <Icon name="Pencil" size={13} />
                      </button>
                      <button onClick={() => deleteTag(t.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Icon name="Trash2" size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add new tag */}
            <div className="flex gap-2">
              <input value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                className="flex-1 border border-border rounded-lg px-3 py-2 font-lora text-sm bg-background focus:outline-none"
                placeholder="Новый ярлык..." />
              <button onClick={addTag}
                className="px-4 py-2 rounded-lg font-lora text-sm text-white transition-all"
                style={{ background: 'hsl(var(--violet))' }}>
                <Icon name="Plus" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW NOTE MODAL ── */}
      {showNewNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-sm animate-slide-up">
            <h2 className="font-cormorant text-2xl mb-5">Новая заметка</h2>
            <div className="space-y-4">
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Название</label>
                <input value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none"
                  placeholder="Название заметки..." autoFocus />
              </div>
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Ярлык</label>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((t) => (
                    <button key={t.id}
                      onClick={() => setNewNoteTag(t.id)}
                      className="font-lora text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={newNoteTag === t.id
                        ? { background: t.color, color: "#fff", borderColor: t.color }
                        : { background: `${t.color}18`, color: t.color, borderColor: `${t.color}44` }
                      }>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewNote(false)}
                className="flex-1 py-2.5 rounded-lg border border-border font-lora text-sm text-muted-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
              <button onClick={createNote}
                className="flex-1 py-2.5 rounded-lg font-lora text-sm text-white transition-all"
                style={{ background: 'hsl(var(--violet))' }}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}