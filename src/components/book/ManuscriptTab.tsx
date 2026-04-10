import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

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

function parseInitialChapters(raw: string): ManuscriptChapter[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "title" in parsed[0]) return parsed;
  } catch (_e) { /* not JSON */ }
  return [{ id: 1, title: "Глава 1", content: raw }];
}

function serializeChapters(chs: ManuscriptChapter[]): string {
  return JSON.stringify(chs);
}

export default function ManuscriptTab({ initialText, onSave, bookId }: { initialText: string; onSave: (t: string) => void; bookId: number }) {
  const initChapters = parseInitialChapters(initialText);
  const isEmpty = initChapters.length === 0;

  const [view, setView] = useState<"chapters" | "full">("chapters");
  const [chapters, setChapters] = useState<ManuscriptChapter[]>(
    isEmpty ? [] : initChapters
  );
  const [activeChId, setActiveChId] = useState<number>(isEmpty ? -1 : initChapters[0].id);
  const [editingChTitle, setEditingChTitle] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  if (!styleRef.current && typeof document !== "undefined") {
    const s = document.createElement("style");
    s.textContent = editorStyles;
    document.head.appendChild(s);
    styleRef.current = s;
  }

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

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
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
        <div className="flex gap-4 min-h-[560px]">
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

          {activeCh && (
            <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden bg-card min-w-0">
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
                <button onClick={() => execCmd("formatBlock", "p")} title="Абзац"
                  className="px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                  Абзац
                </button>
                <div className="w-px h-4 bg-border mx-1" />
                <button onClick={() => execCmd("insertHorizontalRule")} title="Разделитель"
                  className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Icon name="Minus" size={13} />
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-lora text-[11px] text-muted-foreground">
                    {(activeCh.content.trim().split(/\s+/).filter(Boolean).length).toLocaleString("ru")} сл.
                  </span>
                  <button
                    onClick={() => downloadText(activeCh.content, `${activeCh.title}.txt`)}
                    className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Download" size={13} />
                    Скачать главу
                  </button>
                </div>
              </div>

              <div
                ref={editorRef}
                className="rich-editor flex-1 overflow-y-auto scroll-custom"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: activeCh.content }}
                onInput={(e) => updateChContent(activeCh.id, (e.target as HTMLDivElement).innerHTML)}
              />

              <div className="px-5 py-2 border-t border-border bg-muted/20 flex gap-4">
                <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов всего</span>
                <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков всего</span>
              </div>
            </div>
          )}
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
                style={{ color: copied ? 'hsl(var(--violet))' : undefined }}
                >
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
