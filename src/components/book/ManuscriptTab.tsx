import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface ManuscriptChapter {
  id: number;
  title: string;
  content: string; // HTML
}

const EDITOR_STYLES = `
  .ms-editor { outline: none; font-family: "Times New Roman", Times, serif; font-size: 14pt; line-height: 1.8; min-height: 420px; padding: 2rem 3rem; direction: ltr; }
  .ms-editor:focus { outline: none; }
  .ms-editor p { margin: 0; }
  .ms-editor b, .ms-editor strong { font-weight: bold; }
  .ms-editor i, .ms-editor em { font-style: italic; }
  .ms-editor u { text-decoration: underline; }
  .ms-editor h2 { font-size: 16pt; font-weight: bold; margin: 1.2em 0 0.4em; }
  .ms-editor hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
`;

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById("ms-editor-styles")) return;
  const s = document.createElement("style");
  s.id = "ms-editor-styles";
  s.textContent = EDITOR_STYLES;
  document.head.appendChild(s);
}

// Конвертация plain text → HTML (для старых данных без тегов)
function plainToHtml(text: string): string {
  if (!text) return "";
  // Если уже есть HTML-теги — возвращаем как есть
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split("\n")
    .map((line) => line.trim() === "" ? "<p><br></p>" : `<p>${line}</p>`)
    .join("");
}

function parseInitialChapters(raw: string): ManuscriptChapter[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "title" in parsed[0]) {
      return parsed.map((ch: ManuscriptChapter) => ({
        ...ch,
        content: plainToHtml(ch.content),
      }));
    }
  } catch (_e) { /* not JSON */ }
  return [{ id: 1, title: "Глава 1", content: plainToHtml(raw) }];
}

function serializeChapters(chs: ManuscriptChapter[]): string {
  return JSON.stringify(chs);
}

// Считаем текст из HTML (без тегов) для счётчиков
function htmlToText(html: string): string {
  if (!html) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent ?? "";
}

export default function ManuscriptTab({ initialText, onSave }: { initialText: string; onSave: (t: string) => void; bookId: number }) {
  injectStyles();

  const initChapters = parseInitialChapters(initialText);
  const isEmpty = initChapters.length === 0;

  const [view, setView] = useState<"chapters" | "full">("chapters");
  const [chapters, setChapters] = useState<ManuscriptChapter[]>(isEmpty ? [] : initChapters);
  const [activeChId, setActiveChId] = useState<number>(isEmpty ? -1 : initChapters[0].id);
  const [editingChTitle, setEditingChTitle] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileChOpen, setMobileChOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const activeChIdRef = useRef(activeChId);
  const chaptersRef = useRef(chapters);
  const mobileDropRef = useRef<HTMLDivElement>(null);

  activeChIdRef.current = activeChId;
  chaptersRef.current = chapters;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileDropRef.current && !mobileDropRef.current.contains(e.target as Node)) {
        setMobileChOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Обновляем innerHTML редактора при смене активной главы
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const ch = chapters.find((c) => c.id === activeChId);
    const html = ch?.content ?? "";
    // Только если содержимое реально отличается, чтобы не сбрасывать курсор
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
    el.focus();
  }, [activeChId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveChapters = useCallback((updated: ManuscriptChapter[]) => {
    onSave(serializeChapters(updated));
  }, [onSave]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const id = activeChIdRef.current;
    const updated = chaptersRef.current.map((c) => c.id === id ? { ...c, content: html } : c);
    chaptersRef.current = updated;
    setChapters(updated);
    saveChapters(updated);
  }, [saveChapters]);

  const execCmd = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  }, []);

  const activeCh = chapters.find((c) => c.id === activeChId) ?? null;

  const fullText = chapters.map((c) => {
    const d = document.createElement("div");
    d.innerHTML = c.content;
    return `${c.title}\n\n${d.textContent ?? ""}`;
  }).join("\n\n---\n\n");

  const saveChapters2 = (updated: ManuscriptChapter[]) => {
    setChapters(updated);
    onSave(serializeChapters(updated));
  };

  const saveChTitle = (id: number) => {
    if (!titleDraft.trim()) { setEditingChTitle(null); return; }
    saveChapters2(chapters.map((c) => c.id === id ? { ...c, title: titleDraft.trim() } : c));
    setEditingChTitle(null);
  };

  const addChapter = () => {
    const nums = chapters.map((c) => c.title.match(/^Глава\s+(\d+)/i)).filter(Boolean).map((m) => parseInt(m![1]));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const newCh: ManuscriptChapter = { id: Date.now(), title: `Глава ${nextNum}`, content: "" };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setActiveChId(newCh.id);
    onSave(serializeChapters(updated));
  };

  const deleteCh = (id: number) => {
    const updated = chapters.filter((c) => c.id !== id);
    setChapters(updated);
    if (activeChId === id) setActiveChId(updated[0]?.id ?? -1);
    onSave(serializeChapters(updated));
  };

  const moveCh = (id: number, dir: -1 | 1) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const next = idx + dir;
    if (next < 0 || next >= chapters.length) return;
    const arr = [...chapters];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    saveChapters2(arr);
  };

  // Счётчики — с пробелами
  const totalChars = chapters.reduce((s, c) => s + htmlToText(c.content).length, 0);
  const totalWords = chapters.reduce((s, c) => s + htmlToText(c.content).trim().split(/\s+/).filter(Boolean).length, 0);

  const activeChWords = activeCh ? htmlToText(activeCh.content).trim().split(/\s+/).filter(Boolean).length : 0;

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <p className="font-lora text-sm text-muted-foreground leading-relaxed">
        Здесь вы можете писать рукопись, сохраняя прогресс. Делайте, как вам удобно: пишите по порядку или прыгайте по разным сценам. Готовые тексты в любой момент можно скопировать или скачать для редактуры и оформления в Google Docs или Word.
      </p>

      <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
        {([["chapters", "По главам"], ["full", "Полный файл"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg font-lora text-xs transition-all ${view === v ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={view === v ? { background: 'hsl(var(--violet))' } : {}}>
            {l}
          </button>
        ))}
      </div>

      {view === "chapters" && (
        <div className="space-y-3">
          {/* Mobile dropdown */}
          <div className="md:hidden" ref={mobileDropRef}>
            <div className="relative">
              <button onClick={() => setMobileChOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card font-lora text-sm">
                <span className="truncate">{activeCh ? activeCh.title : "Выберите главу"}</span>
                <Icon name={mobileChOpen ? "ChevronUp" : "ChevronDown"} size={15} className="text-muted-foreground flex-shrink-0 ml-2" />
              </button>
              {mobileChOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-20 overflow-hidden">
                  {chapters.map((ch) => (
                    <button key={ch.id} onClick={() => { setActiveChId(ch.id); setMobileChOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left font-lora text-sm transition-colors ${activeChId === ch.id ? "bg-violet/10 text-violet" : "hover:bg-muted/40"}`}>
                      <span className="truncate">{ch.title}</span>
                      {activeChId === ch.id && <Icon name="Check" size={13} className="text-violet flex-shrink-0 ml-2" />}
                    </button>
                  ))}
                  <button onClick={() => { addChapter(); setMobileChOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left font-lora text-sm text-violet hover:bg-muted/40 transition-colors border-t border-border">
                    <Icon name="Plus" size={13} />
                    Новая глава
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 min-h-[560px]">
            {/* Desktop sidebar */}
            <div className="hidden md:block w-48 flex-shrink-0 space-y-1">
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

            {/* Empty state */}
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

            {/* Editor */}
            {activeCh && (
              <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden bg-card min-w-0">
                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 flex-wrap">
                  <button onClick={() => execCmd("undo")} title="Отменить (Ctrl+Z)"
                    className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Icon name="Undo2" size={13} />
                  </button>
                  <button onClick={() => execCmd("redo")} title="Повторить (Ctrl+Y)"
                    className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Icon name="Redo2" size={13} />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button onClick={() => execCmd("bold")} title="Жирный (Ctrl+B)"
                    className="px-2.5 py-1.5 rounded font-bold text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    style={{ fontFamily: '"Times New Roman", serif' }}>Ж</button>
                  <button onClick={() => execCmd("italic")} title="Курсив (Ctrl+I)"
                    className="px-2.5 py-1.5 rounded italic text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    style={{ fontFamily: '"Times New Roman", serif' }}>К</button>
                  <button onClick={() => execCmd("underline")} title="Подчёркнутый (Ctrl+U)"
                    className="px-2.5 py-1.5 rounded underline text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    style={{ fontFamily: '"Times New Roman", serif' }}>Ч</button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button onClick={() => execCmd("insertHTML", "<p>* * *</p>")} title="Разделитель сцены"
                    className="px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora tracking-widest">
                    * * *
                  </button>
                  <button onClick={() => execCmd("insertHTML", "<p>— </p>")} title="Тире для диалога"
                    className="px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                    —
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-lora text-[11px] text-muted-foreground">
                      {activeChWords.toLocaleString("ru")} сл.
                    </span>
                    <button onClick={() => {
                      const d = document.createElement("div");
                      d.innerHTML = activeCh.content;
                      downloadText(d.textContent ?? "", `${activeCh.title}.txt`);
                    }}
                      className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Icon name="Download" size={13} />
                      Скачать главу
                    </button>
                  </div>
                </div>

                {/* contentEditable editor */}
                <div
                  ref={editorRef}
                  className="ms-editor flex-1 overflow-y-auto scroll-custom"
                  contentEditable
                  suppressContentEditableWarning
                  dir="ltr"
                  onInput={handleInput}
                />

                <div className="px-5 py-2 border-t border-border bg-muted/20 flex gap-4">
                  <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов всего</span>
                  <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков (с пробелами)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "full" && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
            <p className="font-lora text-xs text-muted-foreground/60 italic">
              Собрано из всех глав. Рекомендуем сохранять в Google Docs или Word.
            </p>
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <button onClick={() => copyText(fullText)}
                className="flex items-center gap-1.5 font-lora text-xs transition-colors whitespace-nowrap"
                style={{ color: copied ? 'hsl(var(--violet))' : undefined }}>
                <Icon name={copied ? "Check" : "Copy"} size={13} />
                {copied ? "Скопировано" : "Копировать"}
              </button>
              <button onClick={() => downloadText(fullText, "рукопись.txt")}
                className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                <Icon name="Download" size={13} />
                Скачать .txt
              </button>
            </div>
          </div>
          {chapters.length === 0 ? (
            <div className="px-12 py-16 text-center">
              <p className="font-lora text-sm text-muted-foreground italic">Добавьте главы во вкладке «По главам»</p>
            </div>
          ) : (
            <div className="px-12 py-8 scroll-custom overflow-y-auto"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.8', minHeight: '400px', maxHeight: '600px' }}>
              {chapters.map((ch, i) => (
                <div key={ch.id} className={i > 0 ? "mt-8 pt-6 border-t border-border/40" : ""}>
                  <h3 style={{ fontFamily: '"Times New Roman", serif', fontSize: '16pt', fontWeight: 'bold', marginBottom: '1em' }}>
                    {ch.title}
                  </h3>
                  <div dangerouslySetInnerHTML={{ __html: ch.content }} />
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-2 border-t border-border bg-muted/20 flex gap-4">
            <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов</span>
            <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков (с пробелами)</span>
          </div>
        </div>
      )}
    </div>
  );
}