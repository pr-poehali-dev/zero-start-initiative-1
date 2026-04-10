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

Взрослые посоветовали мне не рисовать змей ни снаружи, ни изнутри, а побольше интересоваться географией, историей, арифметикой и правописанием. Вот как случилось, что шести лет я отказался от блестящей карьеры художника.`,
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

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ManuscriptTab({ initialText, onSave }: { initialText: string; onSave: (t: string) => void }) {
  const [view, setView] = useState<"chapters" | "full">("chapters");
  const [chapters, setChapters] = useState<ManuscriptChapter[]>(DEMO_CHAPTERS);
  const [activeChId, setActiveChId] = useState<number>(DEMO_CHAPTERS[0].id);
  const [editingChTitle, setEditingChTitle] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [fullText, setFullText] = useState(initialText);
  const [fullSaved, setFullSaved] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  if (!styleRef.current && typeof document !== "undefined") {
    const s = document.createElement("style");
    s.textContent = editorStyles;
    document.head.appendChild(s);
    styleRef.current = s;
  }

  const activeCh = chapters.find((c) => c.id === activeChId) ?? chapters[0];

  const updateChContent = (id: number, content: string) => {
    setChapters((prev) => prev.map((c) => c.id === id ? { ...c, content } : c));
  };

  const saveChTitle = (id: number) => {
    if (titleDraft.trim()) setChapters((prev) => prev.map((c) => c.id === id ? { ...c, title: titleDraft.trim() } : c));
    setEditingChTitle(null);
  };

  const addChapter = () => {
    const newCh: ManuscriptChapter = { id: Date.now(), title: `Глава ${chapters.length + 1}`, content: "" };
    setChapters([...chapters, newCh]);
    setActiveChId(newCh.id);
  };

  const deleteCh = (id: number) => {
    const remaining = chapters.filter((c) => c.id !== id);
    setChapters(remaining);
    if (activeChId === id) setActiveChId(remaining[0]?.id ?? -1);
  };

  const moveCh = (id: number, dir: -1 | 1) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const next = idx + dir;
    if (next < 0 || next >= chapters.length) return;
    const arr = [...chapters];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setChapters(arr);
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setFullText(ev.target?.result as string ?? ""); setFullSaved(false); };
    reader.readAsText(file, "utf-8");
    if (fileRef.current) fileRef.current.value = "";
  };

  const totalWords = chapters.reduce((s, c) => s + c.content.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalChars = chapters.reduce((s, c) => s + c.content.replace(/\s/g, "").length, 0);

  const allChaptersText = chapters.map((c) => `${c.title}\n\n${c.content}`).join("\n\n\n");

  return (
    <div className="space-y-3">
      {/* Hint */}
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
                  <span className="font-lora text-xs text-muted-foreground">{totalWords.toLocaleString("ru")} слов всего</span>
                  <span className="font-lora text-xs text-muted-foreground">{totalChars.toLocaleString("ru")} знаков</span>
                </div>
                <button onClick={() => downloadText(allChaptersText, "рукопись.txt")}
                  className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Download" size={13} />
                  Скачать
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
              Рекомендуем сохранять результат в Google Docs или Word для дальнейшего оформления и редактуры.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                <Icon name="Upload" size={13} />
                Загрузить .txt / .doc
                <input ref={fileRef} type="file" accept=".txt,.md,.doc,.docx" className="hidden" onChange={handleFileUpload} />
              </button>
              {!fullSaved && (
                <button onClick={() => { onSave(fullText); setFullSaved(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-lora text-xs text-white"
                  style={{ background: 'hsl(var(--violet))' }}>
                  <Icon name="Save" size={12} />
                  Сохранить
                </button>
              )}
            </div>
          </div>
          <textarea
            value={fullText}
            onChange={(e) => { setFullText(e.target.value); setFullSaved(false); }}
            className="w-full resize-none focus:outline-none scroll-custom px-12 py-8"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '14pt', lineHeight: '1.6', minHeight: '520px', background: 'hsl(var(--card))' }}
            placeholder="Вставьте или загрузите полный текст рукописи..."
          />
          <div className="px-5 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
            <div className="flex gap-4">
              <span className="font-lora text-xs text-muted-foreground">
                {fullText.trim().split(/\s+/).filter(Boolean).length.toLocaleString("ru")} слов
              </span>
              <span className="font-lora text-xs text-muted-foreground">
                {fullText.replace(/\s/g, "").length.toLocaleString("ru")} знаков
              </span>
            </div>
            <button onClick={() => downloadText(fullText, "рукопись.txt")}
              className="flex items-center gap-1.5 font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Download" size={13} />
              Скачать
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
