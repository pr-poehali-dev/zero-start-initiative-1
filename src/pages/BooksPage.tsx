import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useBooks, BookMeta, BookFull } from "@/hooks/useBooks";

type BookTab = "manuscript" | "synopsis" | "characters" | "plan" | "lore";

const TABS: { id: BookTab; label: string; icon: string }[] = [
  { id: "manuscript", label: "Рукопись", icon: "FileText" },
  { id: "synopsis", label: "Синопсис", icon: "AlignLeft" },
  { id: "characters", label: "Персонажи", icon: "Users" },
  { id: "plan", label: "План", icon: "List" },
  { id: "lore", label: "Лор", icon: "Sparkles" },
];

interface BookData {
  id: number;
  title: string;
  genre: string;
  words: number;
  manuscript?: string;
  synopsis?: string;
}

const wordsToChars = (w: number) => Math.round(w * 5.5);

export default function BooksPage() {
  const { books, loading, createBook: apiCreate, updateBook, deleteBook, getBook } = useBooks();
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedBookFull, setSelectedBookFull] = useState<BookFull | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [activeTab, setActiveTab] = useState<BookTab>("manuscript");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [bookGoals, setBookGoals] = useState<Record<number, number>>({});
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [goalDraft, setGoalDraft] = useState("");

  const openBook = async (id: number) => {
    setLoadingBook(true);
    setSelectedBook(id);
    const full = await getBook(id);
    setSelectedBookFull(full);
    setLoadingBook(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const nb = await apiCreate(newTitle.trim(), newGenre.trim());
    setShowNewBook(false);
    setNewTitle(""); setNewGenre("");
    if (nb) openBook(nb.id);
  };

  const handleUpdate = async (fields: Partial<{ title: string; genre: string; manuscript: string; synopsis: string }>) => {
    if (!selectedBook) return;
    await updateBook(selectedBook, fields);
    if (selectedBookFull) setSelectedBookFull({ ...selectedBookFull, ...fields });
  };

  const handleDelete = async (id: number) => {
    await deleteBook(id);
    setSelectedBook(null);
    setSelectedBookFull(null);
    setConfirmDelete(null);
  };

  const handleDeleteFromList = async (id: number) => {
    setConfirmDelete(null);
    await deleteBook(id);
  };

  if (selectedBook !== null) {
    const bookMeta = books.find((b) => b.id === selectedBook);
    const book: BookData = selectedBookFull ?? { id: selectedBook, title: bookMeta?.title ?? "", genre: bookMeta?.genre ?? "", words: bookMeta?.words ?? 0 };
    return (
      <BookDetail
        book={book}
        tab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => { setSelectedBook(null); setSelectedBookFull(null); }}
        onUpdate={(fields) => handleUpdate(fields)}
        onDelete={() => handleDelete(selectedBook)}
        loading={loadingBook}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-cormorant text-4xl font-light">Мои книги</h1>
        <button onClick={() => setShowNewBook(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-lora text-sm transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
          <Icon name="Plus" size={16} />
          Новая книга
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'hsl(var(--violet) / 0.3)', borderTopColor: 'hsl(var(--violet))' }} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {books.filter((b) => b.title !== '[удалено]').map((book) => {
            const chars = wordsToChars(book.words);
            const goal = bookGoals[book.id];
            const pct = goal ? Math.min(100, Math.round((chars / goal) * 100)) : null;
            return (
              <div key={book.id} className="group p-6 rounded-xl border border-border bg-card hover-lift transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-14 rounded-md flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'hsl(var(--violet-light))' }}>
                    <span className="text-violet text-lg">✦</span>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book.id)}>
                    <h3 className="font-cormorant text-xl font-medium group-hover:text-violet transition-colors">{book.title}</h3>
                    <p className="font-lora text-xs text-muted-foreground mt-0.5 mb-3">{book.genre || "Жанр не указан"}</p>

                    {/* Words / chars */}
                    <div className="flex gap-3 mb-2">
                      <span className="font-lora text-xs text-muted-foreground">{book.words.toLocaleString("ru")} слов</span>
                      <span className="font-lora text-xs text-muted-foreground">·</span>
                      <span className="font-lora text-xs text-muted-foreground">{chars.toLocaleString("ru")} знаков</span>
                    </div>

                    {/* Goal */}
                    {pct !== null ? (
                      <div>
                        <div className="flex justify-between font-lora text-[11px] text-muted-foreground mb-1">
                          <span>{pct}% от цели</span>
                          {editingGoal === book.id ? (
                            <span className="flex items-center gap-1">
                              <input value={goalDraft}
                                onChange={(e) => setGoalDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const v = parseInt(goalDraft.replace(/\D/g, ""));
                                    if (v > 0) setBookGoals({ ...bookGoals, [book.id]: v });
                                    setEditingGoal(null);
                                  }
                                  if (e.key === "Escape") setEditingGoal(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 border border-border rounded px-1 py-0.5 font-lora text-[11px] bg-background focus:outline-none"
                                placeholder="знаков..." autoFocus />
                              <button onClick={(e) => { e.stopPropagation(); const v = parseInt(goalDraft.replace(/\D/g, "")); if (v > 0) setBookGoals({ ...bookGoals, [book.id]: v }); setEditingGoal(null); }}
                                className="text-violet hover:opacity-70">✓</button>
                            </span>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setEditingGoal(book.id); setGoalDraft(String(goal)); }}
                              className="hover:text-foreground transition-colors">
                              цель: {goal.toLocaleString("ru")} зн. ✎
                            </button>
                          )}
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: 'hsl(var(--violet))' }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setBookGoals({ ...bookGoals, [book.id]: 50000 }); setEditingGoal(book.id); setGoalDraft("50000"); }}
                        className="font-lora text-xs text-muted-foreground/60 hover:text-violet transition-colors">
                        + Поставить цель
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => openBook(book.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-violet hover:bg-muted transition-colors">
                      <Icon name="ChevronRight" size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(book.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowNewBook(true)}
            className="text-left group p-6 rounded-xl border-2 border-dashed border-border hover:border-violet bg-transparent hover-lift transition-all">
            <div className="flex flex-col items-center justify-center h-20 gap-2">
              <Icon name="PlusCircle" size={24} className="text-muted-foreground group-hover:text-violet transition-colors" />
              <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
                Начать новую книгу
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── Confirm delete modal ── */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Icon name="Trash2" size={18} className="text-destructive" />
              </div>
              <h2 className="font-cormorant text-2xl">Удалить книгу?</h2>
            </div>
            <p className="font-lora text-sm text-muted-foreground leading-relaxed mb-6">
              Вы точно хотите удалить книгу <span className="font-medium text-foreground">«{books.find(b => b.id === confirmDelete)?.title}»</span>?
              Это безвозвратный процесс — вся рукопись, персонажи, план и лор будут потеряны. Будьте осторожны.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-lg border border-border font-lora text-sm text-muted-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
              <button onClick={() => handleDeleteFromList(confirmDelete)}
                className="flex-1 py-2.5 rounded-lg font-lora text-sm text-white transition-all bg-destructive hover:opacity-90">
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewBook && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-md animate-slide-up">
            <h2 className="font-cormorant text-2xl mb-5">Новая книга</h2>
            <div className="space-y-4">
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Название</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none focus:ring-1"
                  placeholder="Моя история..." autoFocus />
              </div>
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Жанр</label>
                <input value={newGenre} onChange={(e) => setNewGenre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none focus:ring-1"
                  placeholder="Фэнтези, проза, детектив..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewBook(false)}
                className="flex-1 py-2.5 rounded-lg border border-border font-lora text-sm text-muted-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
              <button onClick={handleCreate}
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

function BookDetail({
  book,
  tab,
  onTabChange,
  onBack,
  onUpdate,
  onDelete,
  loading,
}: {
  book: BookData;
  tab: BookTab;
  onTabChange: (t: BookTab) => void;
  onBack: () => void;
  onUpdate: (fields: Partial<{ title: string; genre: string; manuscript: string; synopsis: string }>) => void;
  onDelete: () => void;
  loading?: boolean;
}) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [titleDraft, setTitleDraft] = useState(book.title);
  const [genreDraft, setGenreDraft] = useState(book.genre);

  const saveMeta = () => {
    if (titleDraft.trim()) onUpdate({ title: titleDraft.trim(), genre: genreDraft.trim() });
    setEditingMeta(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-24 md:pb-10 animate-fade-in">
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <Icon name="ArrowLeft" size={16} />
        Все книги
      </button>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-10 h-14 rounded-md flex-shrink-0 flex items-center justify-center"
          style={{ background: 'hsl(var(--violet-light))' }}>
          <span className="text-violet">✦</span>
        </div>
        {editingMeta ? (
          <div className="flex-1 space-y-2">
            <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
              className="font-cormorant text-3xl font-light bg-transparent border-b border-border focus:outline-none focus:border-violet w-full pb-1"
              autoFocus />
            <input value={genreDraft} onChange={(e) => setGenreDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveMeta()}
              className="font-lora text-sm bg-transparent border-b border-border focus:outline-none focus:border-violet/50 w-full pb-0.5 text-muted-foreground"
              placeholder="Жанр..." />
            <div className="flex gap-2 pt-1">
              <button onClick={saveMeta}
                className="px-3 py-1.5 rounded-lg font-lora text-xs text-white"
                style={{ background: 'hsl(var(--violet))' }}>
                <Icon name="Check" size={12} />
              </button>
              <button onClick={() => setEditingMeta(false)}
                className="px-3 py-1.5 rounded-lg font-lora text-xs border border-border text-muted-foreground hover:bg-muted">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 group flex items-start gap-3">
            <div>
              <h1 className="font-cormorant text-4xl font-light leading-tight">{book.title}</h1>
              <p className="font-lora text-sm text-muted-foreground mt-1">{book.genre || "Жанр не указан"} · {book.words.toLocaleString("ru")} слов</p>
            </div>
            <button onClick={() => { setTitleDraft(book.title); setGenreDraft(book.genre); setEditingMeta(true); }}
              className="mt-1.5 p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
              <Icon name="Pencil" size={14} />
            </button>
          </div>
        )}
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
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'hsl(var(--violet) / 0.3)', borderTopColor: 'hsl(var(--violet))' }} />
        </div>
      ) : (
        <div className="animate-fade-in" key={tab}>
          {tab === "manuscript" && <ManuscriptTab key={book.id} bookId={book.id} initialText={book.manuscript ?? ""} onSave={(t) => onUpdate({ manuscript: t })} />}
          {tab === "synopsis" && <SynopsisTab initialText={book.synopsis ?? ""} onSave={(t) => onUpdate({ synopsis: t })} />}
          {tab === "characters" && <CharactersTab />}
          {tab === "plan" && <PlanTab />}
          {tab === "lore" && <LoreTab />}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// MANUSCRIPT TAB
// ──────────────────────────────────────────────

interface ManuscriptChapter {
  id: number;
  title: string;
  content: string;
}

const DEMO_CHAPTERS: ManuscriptChapter[] = [
  {
    id: 1,
    title: "I. Детство пилота",
    content: `Когда мне было шесть лет, в книге под названием "Правдивые истории", где рассказывалось про девственные леса, я увидел однажды удивительную картинку. На картинке огромная змея — удав — глотала хищного зверя.

В книге говорилось: "Удав заглатывает свою жертву целиком, не жуя. После этого он уже не может шевельнуться и спит полгода подряд, пока не переварит пищу".

Я много раздумывал о полной приключений жизни джунглей и тоже нарисовал цветным карандашом свою первую картинку. Взрослые посоветовали мне не рисовать змей ни снаружи, ни изнутри, а побольше интересоваться географией, историей, арифметикой и правописанием.

Вот как случилось, что шести лет я отказался от блестящей карьеры художника.`,
  },
  {
    id: 2,
    title: "II. Встреча в пустыне",
    content: `Так я жил в одиночестве, и не с кем было мне поговорить по душам. И вот шесть лет тому назад пришлось мне сделать вынужденную посадку в Сахаре. Что-то сломалось в моторе моего самолёта.

Итак, в первый вечер я уснул на песке в пустыне, где на тысячи миль вокруг не было никакого жилья.

Вообразите же моё удивление, когда на рассвете меня разбудил чей-то тоненький голосок. Он сказал:
— Пожалуйста... нарисуй мне барашка!

Я вскочил, точно надо мною грянул гром. Протёр глаза. Стал осматриваться. И увидел забавного маленького человечка, который серьёзно меня разглядывал.`,
  },
  {
    id: 3,
    title: "III. Откуда он явился",
    content: `Не скоро я понял, откуда он явился. Маленький принц засыпал меня вопросами, но когда я спрашивал о чём-нибудь, он словно и не слышал.

Когда он впервые увидел мой самолёт, он спросил:
— Что это за штука?
— Это не штука. Это самолёт. Мой самолёт. Он летает.
— Как! Ты упал с неба?
— Да, — скромно ответил я.
— Вот забавно!..

Потом он прибавил:
— Значит, ты тоже явился с неба. А с какой планеты?`,
  },
];

const editorStyles = `
  .rich-editor { outline: none; font-family: "Times New Roman", Times, serif; font-size: 14pt; line-height: 1.6; min-height: 420px; padding: 2rem 3rem; }
  .rich-editor h2 { font-family: "Times New Roman", Times, serif; font-size: 16pt; font-weight: bold; margin: 1.5em 0 0.5em; }
  .rich-editor p { margin: 0 0 0.8em; }
  .rich-editor:focus { outline: none; }
`;

// Разбираем manuscript из БД: JSON-массив глав или plain-text → одна глава
function parseInitialChapters(raw: string): ManuscriptChapter[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "title" in parsed[0]) return parsed;
  } catch (_e) { /* not JSON */ }
  // plain-text → одна глава
  return [{ id: 1, title: "Глава 1", content: raw }];
}

// Сериализуем главы для сохранения в БД
function serializeChapters(chs: ManuscriptChapter[]): string {
  return JSON.stringify(chs);
}

function ManuscriptTab({ initialText, onSave, bookId }: { initialText: string; onSave: (t: string) => void; bookId: number }) {
  const initChapters = parseInitialChapters(initialText);
  const isEmpty = initChapters.length === 0;

  const [view, setView] = useState<"chapters" | "full">("chapters");
  const [chapters, setChapters] = useState<ManuscriptChapter[]>(
    isEmpty ? [] : initChapters
  );
  const [activeChId, setActiveChId] = useState<number>(isEmpty ? -1 : initChapters[0].id);
  const [editingChTitle, setEditingChTitle] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Inject editor styles once
  if (!styleRef.current && typeof document !== "undefined") {
    const s = document.createElement("style");
    s.textContent = editorStyles;
    document.head.appendChild(s);
    styleRef.current = s;
  }

  const activeCh = chapters.find((c) => c.id === activeChId) ?? null;

  // Полный текст = сумма всех глав
  const fullText = chapters.map((c) => `${c.title}\n\n${c.content}`).join("\n\n---\n\n");

  // Сохраняем при каждом изменении глав
  const saveChapters = (updated: ManuscriptChapter[]) => {
    onSave(serializeChapters(updated));
  };

  const updateChContent = (id: number, content: string) => {
    const updated = chapters.map((c) => c.id === id ? { ...c, content } : c);
    setChapters(updated);
    saveChapters(updated);
  };

  const saveChTitle = (id: number) => {
    if (!titleDraft.trim()) { setEditingChTitle(null); return; }
    const updated = chapters.map((c) => c.id === id ? { ...c, title: titleDraft.trim() } : c);
    setChapters(updated);
    setEditingChTitle(null);
    saveChapters(updated);
  };

  const addChapter = () => {
    const newCh: ManuscriptChapter = { id: Date.now(), title: `Глава ${chapters.length + 1}`, content: "" };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setActiveChId(newCh.id);
    saveChapters(updated);
  };

  const deleteCh = (id: number) => {
    const updated = chapters.filter((c) => c.id !== id);
    setChapters(updated);
    if (activeChId === id) setActiveChId(updated[0]?.id ?? -1);
    saveChapters(updated);
  };

  const moveCh = (id: number, dir: -1 | 1) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const next = idx + dir;
    if (next < 0 || next >= chapters.length) return;
    const arr = [...chapters];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setChapters(arr);
    saveChapters(arr);
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const totalWords = chapters.reduce((s, c) => s + c.content.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalChars = chapters.reduce((s, c) => s + c.content.replace(/\s/g, "").length, 0);

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Intro */}
      <p className="font-lora text-sm text-muted-foreground leading-relaxed">
        Здесь вы можете писать рукопись, сохраняя прогресс. Делайте, как вам удобно: пишите по порядку или прыгайте по разным сценам. Готовые тексты в любой момент можно скопировать или скачать для редактуры и оформления в Google Docs или Word.
      </p>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
        {([["chapters", "По главам"], ["full", "Полный файл"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg font-lora text-xs transition-all ${view === v ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={view === v ? { background: 'hsl(var(--violet))' } : {}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── CHAPTERS VIEW ── */}
      {view === "chapters" && (
        <div className="flex gap-4 min-h-[560px]">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0 space-y-1">
            {chapters.map((ch, idx) => (
              <div key={ch.id}
                className={`group rounded-lg border transition-all ${activeChId === ch.id ? "border-violet/40 bg-violet/5" : "border-transparent hover:border-border"}`}>
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button onClick={() => setActiveChId(ch.id)} className="flex-1 text-left min-w-0">
                    {editingChTitle === ch.id ? (
                      <input value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={() => saveChTitle(ch.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveChTitle(ch.id); if (e.key === "Escape") setEditingChTitle(null); }}
                        className="font-lora text-xs w-full bg-transparent focus:outline-none border-b border-violet/50"
                        autoFocus />
                    ) : (
                      <span className={`font-lora text-xs truncate block leading-snug ${activeChId === ch.id ? "text-violet font-medium" : "text-foreground"}`}>
                        {ch.title}
                      </span>
                    )}
                  </button>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => moveCh(ch.id, -1)} disabled={idx === 0}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <Icon name="ChevronUp" size={11} />
                    </button>
                    <button onClick={() => moveCh(ch.id, 1)} disabled={idx === chapters.length - 1}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <Icon name="ChevronDown" size={11} />
                    </button>
                    <button onClick={() => { setEditingChTitle(ch.id); setTitleDraft(ch.title); }}
                      className="p-0.5 text-muted-foreground hover:text-foreground">
                      <Icon name="Pencil" size={11} />
                    </button>
                    <button onClick={() => deleteCh(ch.id)}
                      className="p-0.5 text-muted-foreground hover:text-destructive">
                      <Icon name="Trash2" size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addChapter}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed border-border hover:border-violet text-muted-foreground hover:text-violet transition-all font-lora text-xs">
              <Icon name="Plus" size={12} />
              Глава
            </button>
          </div>

          {/* Editor area — empty state */}
          {!activeCh && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border">
              <Icon name="FileText" size={32} className="text-muted-foreground/40" />
              <p className="font-lora text-sm text-muted-foreground">Добавьте первую главу, чтобы начать</p>
              <button onClick={addChapter}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-lora text-sm hover-lift transition-all"
                style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
                <Icon name="Plus" size={15} />
                Добавить главу
              </button>
            </div>
          )}

          {/* Editor area */}
          {activeCh && (
            <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden bg-card min-w-0">
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 flex-wrap">
                <button onClick={() => execCmd("bold")} title="Жирный"
                  className="px-2.5 py-1.5 rounded font-bold text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  style={{ fontFamily: '"Times New Roman", serif' }}>Ж</button>
                <button onClick={() => execCmd("italic")} title="Курсив"
                  className="px-2.5 py-1.5 rounded italic text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  style={{ fontFamily: '"Times New Roman", serif' }}>К</button>
                <button onClick={() => execCmd("underline")} title="Подчёркнутый"
                  className="px-2.5 py-1.5 rounded underline text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  style={{ fontFamily: '"Times New Roman", serif' }}>Ч</button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={() => execCmd("formatBlock", "h2")} title="Заголовок"
                  className="px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                  Заголовок
                </button>
                <button onClick={() => execCmd("formatBlock", "p")} title="Обычный текст"
                  className="px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                  Абзац
                </button>
              </div>

              {/* ContentEditable */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="rich-editor flex-1 scroll-custom overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: activeCh.content.replace(/\n/g, "<br>") || "" }}
                onInput={(e) => updateChContent(activeCh.id, (e.target as HTMLDivElement).innerText)}
              />

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border bg-muted/20 flex justify-between items-center">
                <div className="flex gap-4">
                  <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов</span>
                  <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков</span>
                </div>
                <button onClick={downloadAll}
                  className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Download" size={13} />
                  Скачать .txt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FULL FILE VIEW ── */}
      {view === "full" && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
            <p className="font-lora text-xs text-muted-foreground/60 italic">
              Собрано из всех глав. Рекомендуем сохранять в Google Docs или Word для дальнейшего оформления и редактуры.
            </p>
            <button onClick={() => downloadText(fullText, "рукопись.txt")}
              className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap ml-4 flex-shrink-0">
              <Icon name="Download" size={13} />
              Скачать .txt
            </button>
          </div>
          {chapters.length === 0 ? (
            <div className="px-12 py-16 text-center">
              <p className="font-lora text-sm text-muted-foreground italic">Добавьте главы во вкладке «По главам»</p>
            </div>
          ) : (
            <div className="px-12 py-8 scroll-custom overflow-y-auto"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.6', minHeight: '400px', maxHeight: '600px' }}>
              {chapters.map((ch, i) => (
                <div key={ch.id} className={i > 0 ? "mt-8 pt-6 border-t border-border/40" : ""}>
                  <h3 style={{ fontFamily: '"Times New Roman", serif', fontSize: '16pt', fontWeight: 'bold', marginBottom: '1em' }}>
                    {ch.title}
                  </h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{ch.content}</p>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-2 border-t border-border bg-muted/20 flex gap-4">
            <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов</span>
            <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SynopsisTab({ initialText, onSave }: { initialText: string; onSave: (t: string) => void }) {
  const [synopsis, setSynopsis] = useState(initialText);
  const [saved, setSaved] = useState(true);
  const [editing, setEditing] = useState(!initialText);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSynopsis(ev.target?.result as string ?? ""); setSaved(false); setEditing(true); };
    reader.readAsText(file, "utf-8");
  };

  const save = () => { onSave(synopsis); setSaved(true); setEditing(false); };
  const startEdit = () => setEditing(true);

  const wordCount = synopsis.trim().split(/\s+/).filter(Boolean).length;
  const charCount = synopsis.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
          <div className="flex gap-4">
            <span className="font-lora text-xs text-muted-foreground">{wordCount} слов</span>
            <span className="font-lora text-xs text-muted-foreground">{charCount.toLocaleString("ru")} знаков</span>
          </div>
          <div className="flex items-center gap-3">
            {!editing && (
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Upload" size={13} />
                Загрузить .txt
              </button>
            )}
            <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} />
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setSynopsis(initialText); setSaved(true); }}
                  className="font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Отмена
                </button>
                <button onClick={save}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-lora text-xs text-white"
                  style={{ background: 'hsl(var(--violet))' }}>
                  <Icon name="Check" size={13} />
                  Сохранить
                </button>
              </div>
            ) : (
              <button onClick={startEdit}
                className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Pencil" size={13} />
                Редактировать
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <textarea value={synopsis} onChange={(e) => { setSynopsis(e.target.value); setSaved(false); }}
            autoFocus
            className="w-full h-96 px-5 py-4 font-lora text-sm leading-7 bg-card resize-none focus:outline-none scroll-custom"
            placeholder="Напишите синопсис вашей книги..." />
        ) : synopsis ? (
          <div className="px-5 py-4 min-h-40">
            <p className="font-lora text-sm leading-7 text-foreground whitespace-pre-wrap">{synopsis}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Icon name="FileText" size={28} className="text-muted-foreground/40" />
            <p className="font-lora text-sm text-muted-foreground">Синопсис ещё не написан</p>
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-lora text-sm hover-lift transition-all"
              style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
              <Icon name="Plus" size={15} />
              Написать синопсис
            </button>
          </div>
        )}
      </div>
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

const ROLES = [
  { label: "Главный герой",    color: "hsl(267 45% 38%)" },
  { label: "Герой-помощник",   color: "hsl(150 40% 38%)" },
  { label: "Любовный интерес", color: "hsl(330 45% 42%)" },
  { label: "Антагонист",       color: "hsl(0 55% 45%)"  },
  { label: "Второстепенный",   color: "hsl(210 40% 45%)" },
];

const ROLE_COLORS: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.label, r.color]));

const DEFAULT_CHARS: Character[] = [
  {
    id: 1,
    name: "Маленький принц",
    role: "Главный герой",
    photo: null,
    freeText: "Загадочный мальчик с крошечной планеты (астероид B-612). Наивен, искренен, задаёт простые, но глубокие вопросы, которые заставляют задуматься о смысле жизни. Его путешествие по планетам — способ понять людей и самого себя. Через него автор показывает, как важно сохранять детский взгляд на мир — чистый, открытый и честный.",
    questionnaire: {
      fullname: "Маленький принц (имя не называется)",
      appearance: "Маленький золотоволосый мальчик, хрупкий и лёгкий",
      personality: "Наивный, искренний, прямолинейный, задумчивый. Не терпит уклончивых ответов.",
      background: "Живёт один на астероиде B-612, ухаживает за своей Розой и тремя вулканами",
      motivation: "Понять людей и найти настоящую дружбу; вернуться к своей Розе",
      fear: "Что его Роза погибнет без него и что он не успеет вернуться",
      arc: "От наивного одиночества через разочарование во взрослых — к осознанию ценности любви и ответственности",
    },
  },
  {
    id: 2,
    name: "Пилот",
    role: "Герой-помощник",
    photo: null,
    freeText: "Взрослый человек, потерпевший крушение в пустыне. Его прототип — сам Антуан де Сент-Экзюпери. Сначала мыслит как типичный взрослый, но благодаря Маленькому принцу начинает заново учиться видеть мир сердцем. Пилот — связующее звено между миром взрослых и миром детства.",
    questionnaire: {
      fullname: "Пилот (рассказчик, имя не называется)",
      background: "В детстве мечтал стать художником, но взрослые отговорили его. Стал лётчиком.",
      motivation: "Починить самолёт и выжить в пустыне; но постепенно — понять и сохранить дружбу с Принцем",
      arc: "От закрытого «взрослого» мышления к способности снова видеть главное — сердцем",
    },
  },
  {
    id: 3,
    name: "Лис",
    role: "Второстепенный",
    photo: null,
    freeText: "Один из самых важных персонажей с точки зрения смысла истории. Лис учит Маленького принца «приручению» — созданию настоящей связи между существами. Именно он формулирует ключевую мысль книги: «Мы в ответе за тех, кого приручили» и объясняет, что истинная ценность рождается из любви, времени и заботы.",
    questionnaire: {
      motivation: "Быть приручённым — обрести смысл в жизни через связь с другим существом",
      arc: "Показывает Принцу, что дружба требует времени и делает уникальным",
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
  const [newRole, setNewRole] = useState(ROLES[0].label);

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
                <div className="flex items-center gap-3 mb-3">
                  {c.photo ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                      <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-cormorant text-lg font-medium text-white flex-shrink-0"
                      style={{ background: color }}>
                      {c.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cormorant text-lg font-medium leading-none mb-1">{c.name}</h3>
                    <span className="font-lora text-xs px-2 py-0.5 rounded-full inline-block"
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
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button key={r.label} type="button"
                        onClick={() => setNewRole(r.label)}
                        className="font-lora text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={newRole === r.label
                          ? { background: r.color, color: "#fff", borderColor: r.color }
                          : { background: `${r.color}18`, color: r.color, borderColor: `${r.color}44` }
                        }>
                        {r.label}
                      </button>
                    ))}
                  </div>
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
      <div className="flex items-start gap-4 mb-6">
        {(draft.photo || selected.photo) ? (
          <div className="w-14 h-14 rounded-full overflow-hidden border border-border flex-shrink-0">
            <img src={(editing ? draft.photo : selected.photo) ?? ""} alt={selected.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-cormorant text-2xl font-medium text-white flex-shrink-0"
            style={{ background: color }}>
            {selected.name[0]}
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-cormorant text-3xl font-light">{selected.name}</h2>
          {editing ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ROLES.map((r) => (
                <button key={r.label} type="button"
                  onClick={() => setDraft({ ...draft, role: r.label })}
                  className="font-lora text-xs px-2.5 py-1 rounded-full border transition-all"
                  style={draft.role === r.label
                    ? { background: r.color, color: "#fff", borderColor: r.color }
                    : { background: `${r.color}15`, color: r.color, borderColor: `${r.color}40` }
                  }>
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="font-lora text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ background: `${color}22`, color }}>
              {selected.role}
            </span>
          )}
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
  { id: "beginning", label: "Начало", subtitle: "Завязка, мир, герой, конфликт", color: "hsl(210 55% 44%)", episodes: [
    { id: 1, title: "Детство пилота", description: "Пилот вспоминает детство и непонимание со стороны взрослых.", done: true },
    { id: 2, title: "Крушение в пустыне", description: "Он терпит крушение в пустыне и встречает Маленького принца.", done: true },
    { id: 3, title: "Барашек в ящике", description: "Принц просит нарисовать барашка, и между ними завязывается дружба.", done: true },
  ]},
  { id: "development", label: "Развитие", subtitle: "Осложнения, напряжение, новые цели", color: "hsl(267 45% 42%)", episodes: [
    { id: 4, title: "Планета и Роза", description: "Принц рассказывает о своей планете и заботе о Розе.", done: true },
    { id: 5, title: "Обида на Розу", description: "Принц делится сомнениями и обидой на Розу, из-за чего решил отправиться в путешествие.", done: true },
    { id: 6, title: "Планеты взрослых", description: "Принц посещает шесть планет: король, честолюбец, пьяница, деловой человек, фонарщик, географ.", done: true },
    { id: 7, title: "Одиночество на Земле", description: "Принц прибывает на Землю и чувствует себя одиноким.", done: true },
  ]},
  { id: "turning", label: "Поворот", subtitle: "Точка невозврата", color: "hsl(30 60% 44%)", episodes: [
    { id: 8, title: "Сад роз", description: "Принц встречает множество роз и понимает, что его Роза не уникальна внешне.", done: true },
    { id: 9, title: "Урок Лиса", description: "Лис учит его дружбе и ответственности за тех, кого приручили.", done: true },
    { id: 10, title: "Осознание", description: "Принц осознаёт истинную ценность своей Розы — не во внешности, а в привязанности.", done: true },
  ]},
  { id: "climax", label: "Кульминация", subtitle: "Главный выбор, финальное сражение, пик", color: "hsl(0 50% 46%)", episodes: [
    { id: 11, title: "Поиск воды", description: "Пилот и Принц вместе ищут воду в пустыне и сближаются.", done: true },
    { id: 12, title: "Решение вернуться", description: "Принц решает вернуться к своей планете и Розе.", done: true },
    { id: 13, title: "Укус змеи", description: "Он позволяет змее укусить себя, чтобы покинуть Землю.", done: true },
  ]},
  { id: "resolution", label: "Развязка", subtitle: "Последствия, финальная сцена", color: "hsl(150 40% 38%)", episodes: [
    { id: 14, title: "Возвращение пилота", description: "Пилот чинит самолёт и возвращается домой с памятью о Принце.", done: true },
    { id: 15, title: "Обращение к читателю", description: "Пилот просит читателя помнить о Маленьком принце, глядя на звёзды.", done: true },
  ]},
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
    const { sectionId, newSectionId, ep } = editingEp as typeof editingEp & { newSectionId: string };
    if (newSectionId && newSectionId !== sectionId) {
      // move to different section
      setSections(sections.map((sec) => {
        if (sec.id === sectionId) return { ...sec, episodes: sec.episodes.filter((e) => e.id !== ep.id) };
        if (sec.id === newSectionId) return { ...sec, episodes: [...sec.episodes, ep] };
        return sec;
      }));
    } else {
      setSections(sections.map((sec) =>
        sec.id !== sectionId ? sec : {
          ...sec,
          episodes: sec.episodes.map((e) => e.id === ep.id ? ep : e),
        }
      ));
    }
    setEditingEp(null);
  };

  const deleteEp = (sectionId: string, epId: number) => {
    setSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : { ...sec, episodes: sec.episodes.filter((e) => e.id !== epId) }
    ));
    setEditingEp(null);
  };

  const moveEp = (sectionId: string, epId: number, dir: -1 | 1) => {
    setSections(sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const eps = [...sec.episodes];
      const idx = eps.findIndex((e) => e.id === epId);
      const next = idx + dir;
      if (next < 0 || next >= eps.length) return sec;
      [eps[idx], eps[next]] = [eps[next], eps[idx]];
      return { ...sec, episodes: eps };
    }));
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
              {sec.episodes.map((ep, epIdx) => (
                <div key={ep.id}
                  className={`grid grid-cols-[2rem_1fr_2fr_6rem] gap-3 px-4 py-3 items-start transition-colors ${ep.done ? "bg-muted/20" : "bg-card"}`}>
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
                  <div className="flex gap-0.5 justify-end items-start">
                    <button onClick={() => moveEp(sec.id, ep.id, -1)} disabled={epIdx === 0}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-25">
                      <Icon name="ChevronUp" size={12} />
                    </button>
                    <button onClick={() => moveEp(sec.id, ep.id, 1)} disabled={epIdx === sec.episodes.length - 1}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-25">
                      <Icon name="ChevronDown" size={12} />
                    </button>
                    <button onClick={() => setEditingEp({ sectionId: sec.id, newSectionId: sec.id, ep: { ...ep } } as Parameters<typeof setEditingEp>[0])}
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
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background resize-none focus:outline-none scroll-custom" />
              </div>
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Раздел</label>
                <div className="flex flex-wrap gap-2">
                  {sections.map((sec) => {
                    const currentSectionId = (editingEp as typeof editingEp & { newSectionId?: string }).newSectionId ?? editingEp.sectionId;
                    return (
                      <button key={sec.id} type="button"
                        onClick={() => setEditingEp({ ...editingEp, newSectionId: sec.id } as Parameters<typeof setEditingEp>[0])}
                        className="font-lora text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={currentSectionId === sec.id
                          ? { background: sec.color, color: "#fff", borderColor: sec.color }
                          : { background: `${sec.color}15`, color: sec.color, borderColor: `${sec.color}40` }
                        }>
                        {sec.label}
                      </button>
                    );
                  })}
                </div>
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
  tagIds: number[];
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
  { id: 1, label: "Мироустройство", color: TAG_PALETTE[1] },
  { id: 2, label: "Символизм",      color: TAG_PALETTE[0] },
];

const DEFAULT_NOTES: LoreNote[] = [
  {
    id: 1,
    title: "Астероид B-612",
    tagIds: [1],
    text: "Маленький принц живёт на крошечном астероиде, где есть три вулкана (два активных и один потухший) и растёт его Роза. Он ежедневно ухаживает за планетой: прочищает вулканы и вырывает ростки баобабов, чтобы те не разрушили астероид.\n\nЭто символ ответственности за свой мир и порядок в душе.",
  },
  {
    id: 2,
    title: "Баобабы как угроза",
    tagIds: [2],
    text: "Баобабы — опасные растения, которые сначала выглядят безобидно, но со временем могут уничтожить целую планету. Принц предупреждает, что их нужно искоренять сразу.\n\nЭто метафора плохих привычек и разрушительных мыслей, которые важно замечать на ранней стадии.",
  },
  {
    id: 3,
    title: "Путешествие по планетам",
    tagIds: [1, 2],
    text: "Каждая планета, которую посещает принц, населена одним взрослым персонажем, воплощающим человеческие пороки: власть, тщеславие, зависимость, жадность, слепое следование правилам.\n\nЭти эпизоды формируют сатирическую картину «взрослого мира» и подчёркивают одиночество людей.",
  },
];

function LoreTab() {
  const [tags, setTags] = useState<LoreTag[]>(DEFAULT_TAGS);
  const [notes, setNotes] = useState<LoreNote[]>(DEFAULT_NOTES);
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<LoreNote | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState<LoreNote | null>(null);

  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState("");

  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<number[]>([]);

  const filtered = activeTag ? notes.filter((n) => n.tagIds.includes(activeTag)) : notes;
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

  const toggleNoteTag = (tagId: number, current: number[], setter: (v: number[]) => void) => {
    if (current.includes(tagId)) {
      setter(current.filter((id) => id !== tagId));
    } else if (current.length < 3) {
      setter([...current, tagId]);
    }
  };

  const createNote = () => {
    if (!newNoteTitle.trim()) return;
    const n: LoreNote = { id: Date.now(), title: newNoteTitle.trim(), tagIds: newNoteTags, text: "" };
    setNotes([...notes, n]);
    setShowNewNote(false);
    setNewNoteTitle(""); setNewNoteTags([]);
    openNoteDetail(n, true);
  };

  const openNoteDetail = (n: LoreNote, startEditing = false) => {
    setOpenNote(n);
    setNoteDraft({ ...n, tagIds: [...n.tagIds] });
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
    return (
      <div className="animate-fade-in">
        <button onClick={() => setOpenNote(null)}
          className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
          <Icon name="ArrowLeft" size={15} />
          Все заметки
        </button>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editingNote ? (
                  <input value={noteDraft.title}
                    onChange={(e) => setNoteDraft({ ...noteDraft, title: e.target.value })}
                    className="font-cormorant text-3xl font-light bg-transparent border-b border-border focus:outline-none focus:border-violet w-full pb-1"
                    autoFocus />
                ) : (
                  <h2 className="font-cormorant text-3xl font-light">{openNote.title}</h2>
                )}
                {/* Tags below title */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {editingNote ? (
                    <>
                      {tags.map((t) => {
                        const active = noteDraft.tagIds.includes(t.id);
                        return (
                          <button key={t.id} type="button"
                            onClick={() => toggleNoteTag(t.id, noteDraft.tagIds, (v) => setNoteDraft({ ...noteDraft, tagIds: v }))}
                            className="font-lora text-xs px-2.5 py-1 rounded-full border transition-all"
                            style={active
                              ? { background: t.color, color: "#fff", borderColor: t.color }
                              : { background: `${t.color}15`, color: t.color, borderColor: `${t.color}40` }
                            }>
                            {active ? "✓ " : ""}{t.label}
                          </button>
                        );
                      })}
                      {noteDraft.tagIds.length >= 3 && (
                        <span className="font-lora text-[11px] text-muted-foreground self-center">макс. 3</span>
                      )}
                    </>
                  ) : (
                    openNote.tagIds.map((tid) => {
                      const t = tagById(tid);
                      return t ? (
                        <span key={tid} className="font-lora text-xs px-2.5 py-1 rounded-full"
                          style={{ background: `${t.color}20`, color: t.color }}>
                          {t.label}
                        </span>
                      ) : null;
                    })
                  )}
                </div>
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
          </div>

          {/* Content */}
          <div className="px-6 py-5">
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
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Tags filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setActiveTag(null)}
          className={`font-lora text-xs px-3 py-1.5 rounded-full border transition-all ${
            activeTag === null ? "border-transparent text-white" : "border-border text-muted-foreground hover:text-foreground"
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
        {filtered.map((note) => (
          <button key={note.id}
            onClick={() => openNoteDetail(note)}
            className="text-left group p-5 rounded-xl border border-border bg-card hover-lift transition-all">
            <h3 className="font-cormorant text-lg font-medium mb-1.5 group-hover:text-violet transition-colors">
              {note.title}
            </h3>
            <p className="font-lora text-sm text-muted-foreground line-clamp-2 mb-3">{note.text}</p>
            {/* Tags at bottom */}
            {note.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {note.tagIds.map((tid) => {
                  const t = tagById(tid);
                  return t ? (
                    <span key={tid} className="font-lora text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: `${t.color}18`, color: t.color }}>
                      {t.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </button>
        ))}

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
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">
                  Ярлыки <span className="text-muted-foreground/50">(до 3)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((t) => {
                    const active = newNoteTags.includes(t.id);
                    return (
                      <button key={t.id} type="button"
                        onClick={() => toggleNoteTag(t.id, newNoteTags, setNewNoteTags)}
                        className="font-lora text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={active
                          ? { background: t.color, color: "#fff", borderColor: t.color }
                          : { background: `${t.color}18`, color: t.color, borderColor: `${t.color}44` }
                        }>
                        {t.label}
                      </button>
                    );
                  })}
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