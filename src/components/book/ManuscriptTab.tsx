import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface ManuscriptChapter {
  id: number;
  title: string;
  content: string;
}

function parseInitialChapters(raw: string): ManuscriptChapter[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "title" in parsed[0]) {
      // Если content содержит HTML — конвертируем в plain text
      return parsed.map((ch: ManuscriptChapter) => ({
        ...ch,
        content: htmlToPlain(ch.content),
      }));
    }
  } catch (_e) { /* not JSON */ }
  return [{ id: 1, title: "Глава 1", content: raw }];
}

function htmlToPlain(html: string): string {
  if (!html) return "";
  // Если нет HTML-тегов — возвращаем как есть
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  const div = document.createElement("div");
  div.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<hr[^>]*>/gi, "\n---\n");
  return div.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? "";
}

function serializeChapters(chs: ManuscriptChapter[]): string {
  return JSON.stringify(chs);
}

export default function ManuscriptTab({ initialText, onSave, bookId }: { initialText: string; onSave: (t: string) => void; bookId: number }) {
  const initChapters = parseInitialChapters(initialText);
  const isEmpty = initChapters.length === 0;

  const [view, setView] = useState<"chapters" | "full">("chapters");
  const [chapters, setChapters] = useState<ManuscriptChapter[]>(isEmpty ? [] : initChapters);
  const [activeChId, setActiveChId] = useState<number>(isEmpty ? -1 : initChapters[0].id);
  const [editingChTitle, setEditingChTitle] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileChOpen, setMobileChOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileDropRef.current && !mobileDropRef.current.contains(e.target as Node)) {
        setMobileChOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Фокус на textarea при смене главы
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeChId]);

  const activeCh = chapters.find((c) => c.id === activeChId) ?? null;
  const fullText = chapters.map((c) => `${c.title}\n\n${c.content}`).join("\n\n---\n\n");

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
    const chapterNums = chapters
      .map((c) => c.title.match(/^Глава\s+(\d+)/i))
      .filter(Boolean)
      .map((m) => parseInt(m![1]));
    const nextNum = chapterNums.length > 0 ? Math.max(...chapterNums) + 1 : 1;
    const newCh: ManuscriptChapter = { id: Date.now(), title: `Глава ${nextNum}`, content: "" };
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

  const totalWords = chapters.reduce((s, c) => s + c.content.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalChars = chapters.reduce((s, c) => s + c.content.replace(/\s/g, "").length, 0);

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
          {/* Mobile: dropdown chapter selector */}
          <div className="md:hidden" ref={mobileDropRef}>
            <div className="relative">
              <button
                onClick={() => setMobileChOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card font-lora text-sm"
              >
                <span className="truncate">{activeCh ? activeCh.title : "Выберите главу"}</span>
                <Icon name={mobileChOpen ? "ChevronUp" : "ChevronDown"} size={15} className="text-muted-foreground flex-shrink-0 ml-2" />
              </button>
              {mobileChOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-20 overflow-hidden">
                  {chapters.map((ch) => (
                    <button key={ch.id}
                      onClick={() => { setActiveChId(ch.id); setMobileChOpen(false); }}
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
            {/* Desktop: sidebar */}
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
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20 flex-wrap">
                  <span className="font-lora text-[11px] text-muted-foreground">
                    {activeCh.content.trim().split(/\s+/).filter(Boolean).length.toLocaleString("ru")} сл.
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => downloadText(activeCh.content, `${activeCh.title}.txt`)}
                      className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Icon name="Download" size={13} />
                      Скачать главу
                    </button>
                  </div>
                </div>

                {/* Textarea — plain text, абзацы через Enter */}
                <textarea
                  ref={textareaRef}
                  value={activeCh.content}
                  onChange={(e) => updateChContent(activeCh.id, e.target.value)}
                  dir="ltr"
                  className="flex-1 resize-none focus:outline-none scroll-custom px-8 py-8 md:px-12 md:py-8"
                  style={{
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '14pt',
                    lineHeight: '1.8',
                    minHeight: '420px',
                    background: 'transparent',
                    direction: 'ltr',
                    unicodeBidi: 'plaintext',
                  }}
                  placeholder="Начните писать..."
                />

                <div className="px-5 py-2 border-t border-border bg-muted/20 flex gap-4">
                  <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов всего</span>
                  <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков всего</span>
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
              Собрано из всех глав. Рекомендуем сохранять в Google Docs или Word для дальнейшего оформления и редактуры.
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
            <div className="px-8 md:px-12 py-8 scroll-custom overflow-y-auto"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.8', minHeight: '400px', maxHeight: '600px' }}>
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
