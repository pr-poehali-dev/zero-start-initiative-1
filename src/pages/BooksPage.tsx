import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useBooks, BookMeta, BookFull } from "@/hooks/useBooks";
import ManuscriptTab from "@/components/book/ManuscriptTab";
import CharactersTab from "@/components/book/CharactersTab";
import PlanTab from "@/components/book/PlanTab";
import LoreTab from "@/components/book/LoreTab";
import IdeasTab from "@/components/book/IdeasTab";

type BookTab = "manuscript" | "synopsis" | "characters" | "plan" | "lore" | "ideas";

const TABS: { id: BookTab; label: string; icon: string }[] = [
  { id: "manuscript", label: "Рукопись", icon: "FileText" },
  { id: "synopsis", label: "Синопсис", icon: "AlignLeft" },
  { id: "characters", label: "Персонажи", icon: "Users" },
  { id: "plan", label: "План", icon: "List" },
  { id: "lore", label: "Лор", icon: "Sparkles" },
  { id: "ideas", label: "Идеи", icon: "Lightbulb" },
];

interface BookData {
  id: number;
  title: string;
  genre: string;
  words: number;
  manuscript?: string;
  synopsis?: string;
  characters?: string;
  plan?: string;
  lore_tags?: string;
  lore_notes?: string;
  ideas_tags?: string;
  ideas_notes?: string;
}

const GOALS_KEY = "scriptorium_book_goals";
const ORDER_KEY = "scriptorium_book_order";

function loadGoals(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}"); } catch { return {}; }
}
function saveGoalsToStorage(g: Record<number, number>) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(g));
}
function loadOrder(): number[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || "[]"); } catch { return {}; }
}
function saveOrder(ids: number[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
}

const SHEETS_PER_CHARS = 40000; // 1 авт. лист = 40 000 знаков с пробелами
const toSheets = (chars: number) => (chars / SHEETS_PER_CHARS).toFixed(1);

export default function BooksPage() {
  const { books, loading, createBook: apiCreate, updateBook, deleteBook, getBook, recountBooks } = useBooks();

  // Пересчёт при первом открытии (один раз на сессию)
  useEffect(() => {
    const key = "scriptorium_recounted";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      recountBooks();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedBookFull, setSelectedBookFull] = useState<BookFull | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [activeTab, setActiveTab] = useState<BookTab>("manuscript");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [bookGoals, setBookGoals] = useState<Record<number, number>>(loadGoals);
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [bookOrder, setBookOrder] = useState<number[]>(loadOrder);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const setGoal = (bookId: number, chars: number) => {
    const updated = { ...bookGoals, [bookId]: chars };
    setBookGoals(updated);
    saveGoalsToStorage(updated);
  };

  const getSortedBooks = (rawBooks: typeof books) => {
    const visible = rawBooks.filter((b) => b.title !== '[удалено]');
    if (bookOrder.length === 0) return visible;
    const ordered = bookOrder.map((id) => visible.find((b) => b.id === id)).filter(Boolean) as typeof visible;
    const rest = visible.filter((b) => !bookOrder.includes(b.id));
    return [...ordered, ...rest];
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("bookId", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData("bookId"), 10);
    if (draggedId === targetId) return;
    const sorted = getSortedBooks(books);
    const ids = sorted.map((b) => b.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedId);
    setBookOrder(ids);
    saveOrder(ids);
    setDragOver(null);
  };

  const openBook = async (id: number) => {
    setLoadingBook(true);
    setSelectedBook(id);
    let full = await getBook(id);
    if (!full) {
      await new Promise((r) => setTimeout(r, 1500));
      full = await getBook(id);
    }
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

  const handleUpdate = async (fields: Partial<{
    title: string; genre: string; manuscript: string; synopsis: string;
    characters: string; plan: string; lore_tags: string; lore_notes: string;
    ideas_tags: string; ideas_notes: string;
  }>) => {
    if (!selectedBook) return;
    await updateBook(selectedBook, fields);
    if (selectedBookFull) setSelectedBookFull({ ...selectedBookFull, ...fields });
  };

  const removeGoal = (id: number) => {
    const updated = { ...bookGoals };
    delete updated[id];
    setBookGoals(updated);
    saveGoalsToStorage(updated);
  };

  const handleDelete = async (id: number) => {
    await deleteBook(id);
    removeGoal(id);
    setSelectedBook(null);
    setSelectedBookFull(null);
    setConfirmDelete(null);
  };

  const handleDeleteFromList = async (id: number) => {
    setConfirmDelete(null);
    await deleteBook(id);
    removeGoal(id);
  };

  if (selectedBook !== null) {
    const bookMeta = books.find((b) => b.id === selectedBook);
    const book: BookData = selectedBookFull ?? { id: selectedBook, title: bookMeta?.title ?? "", genre: bookMeta?.genre ?? "", words: bookMeta?.words ?? 0 };
    const loadFailed = !loadingBook && !selectedBookFull;
    return (
      <>
        {loadFailed && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-5 py-3 flex items-center gap-3 font-lora text-sm shadow-lg">
            Не удалось загрузить данные книги
            <button onClick={() => openBook(selectedBook)}
              className="underline hover:no-underline font-medium">
              Попробовать снова
            </button>
          </div>
        )}
        <BookDetail
          book={book}
          tab={activeTab}
          onTabChange={setActiveTab}
          onBack={() => { setSelectedBook(null); setSelectedBookFull(null); }}
          onUpdate={(fields) => handleUpdate(fields)}
          onDelete={() => handleDelete(selectedBook)}
          loading={loadingBook}
          goalChars={bookGoals[book.id]}
          onSetGoal={(chars) => setGoal(book.id, chars)}
        />
      </>
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
          {getSortedBooks(books).map((book) => {
            const chars = book.words;
            const goal = bookGoals[book.id];
            const pct = goal ? Math.min(100, Math.round((chars / goal) * 100)) : null;
            const isOver = dragOver === book.id;
            return (
              <div key={book.id}
                draggable
                onDragStart={(e) => handleDragStart(e, book.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(book.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, book.id)}
                className={`group p-6 rounded-xl border bg-card hover-lift transition-all ${isOver ? "border-violet scale-[1.01]" : "border-border"}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-14 rounded-md flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                    style={{ background: 'hsl(var(--violet-light))' }}>
                    <span className="text-violet text-lg">✦</span>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openBook(book.id)}>
                    <h3 className="font-cormorant text-xl font-medium group-hover:text-violet transition-colors">{book.title}</h3>
                    <p className="font-lora text-xs text-muted-foreground mt-0.5 mb-3">{book.genre || "Жанр не указан"}</p>

                    <div className="flex gap-3 mb-2 flex-wrap">
                      <span className="font-lora text-xs text-muted-foreground">{book.words.toLocaleString("ru")} зн.</span>
                      <span className="font-lora text-xs text-muted-foreground">·</span>
                      <span className="font-lora text-xs text-muted-foreground">{toSheets(book.words)} авт. л.</span>
                    </div>

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
                                    if (v > 0) setGoal(book.id, v);
                                    setEditingGoal(null);
                                  }
                                  if (e.key === "Escape") setEditingGoal(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 border border-border rounded px-1 py-0.5 font-lora text-[11px] bg-background focus:outline-none"
                                placeholder="знаков..." autoFocus />
                              <button onClick={(e) => { e.stopPropagation(); const v = parseInt(goalDraft.replace(/\D/g, "")); if (v > 0) setGoal(book.id, v); setEditingGoal(null); }}
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
                        onClick={(e) => { e.stopPropagation(); setGoal(book.id, 50000); setEditingGoal(book.id); setGoalDraft("50000"); }}
                        className="font-lora text-xs text-muted-foreground/60 hover:text-violet transition-colors">
                        + Поставить цель
                      </button>
                    )}
                  </div>

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
  goalChars,
  onSetGoal,
}: {
  book: BookData;
  tab: BookTab;
  onTabChange: (t: BookTab) => void;
  onBack: () => void;
  onUpdate: (fields: Partial<{
    title: string; genre: string; manuscript: string; synopsis: string;
    characters: string; plan: string; lore_tags: string; lore_notes: string;
  }>) => void;
  onDelete: () => void;
  loading?: boolean;
  goalChars?: number;
  onSetGoal: (chars: number) => void;
}) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [titleDraft, setTitleDraft] = useState(book.title);
  const [genreDraft, setGenreDraft] = useState(book.genre);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");

  const chars = book.words; // words = знаки с пробелами
  const pct = goalChars ? Math.min(100, Math.round((chars / goalChars) * 100)) : null;

  const saveMeta = () => {
    if (titleDraft.trim()) onUpdate({ title: titleDraft.trim(), genre: genreDraft.trim() });
    setEditingMeta(false);
  };

  const saveGoal = () => {
    const v = parseInt(goalDraft.replace(/\D/g, ""));
    if (v > 0) onSetGoal(v);
    setEditingGoal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-24 md:pb-10 animate-fade-in">
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
          <div className="flex-1 group">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="font-cormorant text-4xl font-light leading-tight">{book.title}</h1>
                <p className="font-lora text-sm text-muted-foreground mt-1">{book.genre || "Жанр не указан"}</p>
              </div>
              <button onClick={() => { setTitleDraft(book.title); setGenreDraft(book.genre); setEditingMeta(true); }}
                className="mt-1.5 p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all flex-shrink-0">
                <Icon name="Pencil" size={14} />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-lora text-xs text-muted-foreground">Текущий объём</p>
                  <p className="font-lora text-sm font-medium">
                    {book.words.toLocaleString("ru")} зн.
                    <span className="text-muted-foreground font-normal ml-2">· {toSheets(book.words)} авт. л.</span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-lora text-xs text-muted-foreground">Цель</p>
                  {editingGoal ? (
                    <div className="flex items-center gap-1.5">
                      <input value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); if (e.key === "Escape") setEditingGoal(false); }}
                        className="w-24 border border-border rounded px-2 py-0.5 font-lora text-xs bg-background focus:outline-none"
                        placeholder="знаков..." autoFocus />
                      <button onClick={saveGoal} className="text-violet hover:opacity-70 font-lora text-xs">✓</button>
                      <button onClick={() => setEditingGoal(false)} className="text-muted-foreground hover:text-foreground font-lora text-xs">✕</button>
                    </div>
                  ) : goalChars ? (
                    <button onClick={() => { setGoalDraft(String(goalChars)); setEditingGoal(true); }}
                      className="font-lora text-sm hover:text-violet transition-colors">
                      {goalChars.toLocaleString("ru")} зн. ✎
                    </button>
                  ) : (
                    <button onClick={() => { setGoalDraft("50000"); setEditingGoal(true); }}
                      className="font-lora text-xs text-violet hover:opacity-80 transition-opacity">
                      + Поставить цель
                    </button>
                  )}
                </div>
              </div>

              {pct !== null && (
                <div>
                  <div className="flex justify-between font-lora text-[11px] text-muted-foreground mb-1">
                    <span>{pct}% выполнено</span>
                    <span>{chars.toLocaleString("ru")} / {goalChars!.toLocaleString("ru")} зн.</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: 'hsl(var(--violet))' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'hsl(var(--violet) / 0.3)', borderTopColor: 'hsl(var(--violet))' }} />
        </div>
      ) : (
        <div className="animate-fade-in" key={tab}>
          {tab === "manuscript" && <ManuscriptTab key={book.id} bookId={book.id} initialText={book.manuscript ?? ""} onSave={(t) => onUpdate({ manuscript: t })} />}
          {tab === "synopsis" && <SynopsisTab initialText={book.synopsis ?? ""} onSave={(t) => onUpdate({ synopsis: t })} />}
          {tab === "characters" && <CharactersTab key={book.id} bookId={book.id} initialData={book.characters ?? ""} onSave={(v) => onUpdate({ characters: v })} />}
          {tab === "plan" && <PlanTab key={book.id} bookId={book.id} initialData={book.plan ?? ""} onSave={(v) => onUpdate({ plan: v })} />}
          {tab === "lore" && <LoreTab key={book.id} initialTags={book.lore_tags ?? ""} initialNotes={book.lore_notes ?? ""} onSaveTags={(v) => onUpdate({ lore_tags: v })} onSaveNotes={(v) => onUpdate({ lore_notes: v })} />}
          {tab === "ideas" && <IdeasTab key={book.id} initialTags={book.ideas_tags ?? ""} initialNotes={book.ideas_notes ?? ""} onSaveTags={(v) => onUpdate({ ideas_tags: v })} onSaveNotes={(v) => onUpdate({ ideas_notes: v })} />}
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