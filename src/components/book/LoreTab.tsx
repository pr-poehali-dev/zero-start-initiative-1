import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

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

const loreEditorStyles = `
  .lore-editor { outline: none; font-family: var(--font-lora, Georgia, serif); font-size: 14px; line-height: 1.7; min-height: 300px; direction: ltr; }
  .lore-editor:focus { outline: none; }
  .lore-editor table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  .lore-editor td, .lore-editor th { border: 1px solid hsl(var(--border)); padding: 6px 10px; text-align: left; min-width: 80px; }
  .lore-editor th { background: hsl(var(--muted)); font-weight: bold; }
  .lore-editor p { margin: 0 0 0.6em; }
  .lore-editor b, .lore-editor strong { font-weight: bold; }
  .lore-editor i, .lore-editor em { font-style: italic; }
  .lore-editor u { text-decoration: underline; }
`;

function injectLoreStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("lore-editor-styles")) return;
  const s = document.createElement("style");
  s.id = "lore-editor-styles";
  s.textContent = loreEditorStyles;
  document.head.appendChild(s);
}

function insertTable(rows: number, cols: number) {
  const header = Array.from({ length: cols }, (_, i) => `<th>Колонка ${i + 1}</th>`).join("");
  const cells = Array.from({ length: cols }, () => `<td>&nbsp;</td>`).join("");
  const bodyRows = Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");
  return `<table><thead><tr>${header}</tr></thead><tbody>${bodyRows}</tbody></table><p><br></p>`;
}

function noteToText(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

export default function LoreTab({ initialTags, initialNotes, onSaveTags, onSaveNotes }: {
  initialTags: string;
  initialNotes: string;
  onSaveTags: (v: string) => void;
  onSaveNotes: (v: string) => void;
}) {
  injectLoreStyles();

  const parseTags = (): LoreTag[] => {
    try { if (initialTags) return JSON.parse(initialTags); } catch (_e) { /* ignore */ }
    return [];
  };
  const parseNotes = (): LoreNote[] => {
    try { if (initialNotes) return JSON.parse(initialNotes); } catch (_e) { /* ignore */ }
    return [];
  };

  const [tags, setTags] = useState<LoreTag[]>(parseTags);
  const [notes, setNotes] = useState<LoreNote[]>(parseNotes);
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const [openNote, setOpenNote] = useState<LoreNote | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState<LoreNote | null>(null);
  const [search, setSearch] = useState("");

  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState("");

  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<number[]>([]);

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingNote && editorRef.current && noteDraft) {
      editorRef.current.innerHTML = noteDraft.text;
      // Ставим курсор в конец
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editingNote]);

  const tagById = (id: number) => tags.find((t) => t.id === id);

  const filtered = notes.filter((n) => {
    const matchTag = activeTag === null || n.tagIds.includes(activeTag);
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || noteToText(n.text).toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const updateTags = (updated: LoreTag[]) => {
    setTags(updated);
    onSaveTags(JSON.stringify(updated));
  };
  const updateNotes = (updated: LoreNote[]) => {
    setNotes(updated);
    onSaveNotes(JSON.stringify(updated));
  };

  const addTag = () => {
    if (!newTagLabel.trim()) return;
    const color = TAG_PALETTE[tags.length % TAG_PALETTE.length];
    updateTags([...tags, { id: Date.now(), label: newTagLabel.trim(), color }]);
    setNewTagLabel("");
  };

  const saveTagEdit = (id: number) => {
    if (!editingTagLabel.trim()) return;
    updateTags(tags.map((t) => t.id === id ? { ...t, label: editingTagLabel.trim() } : t));
    setEditingTagId(null);
  };

  const deleteTag = (id: number) => {
    updateTags(tags.filter((t) => t.id !== id));
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
    updateNotes([...notes, n]);
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
    if (!noteDraft || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const saved = { ...noteDraft, text: html };
    const updated = notes.map((n) => n.id === saved.id ? saved : n);
    updateNotes(updated);
    setOpenNote(saved);
    setNoteDraft(saved);
    setEditingNote(false);
  };

  const deleteNote = (id: number) => {
    updateNotes(notes.filter((n) => n.id !== id));
    setOpenNote(null);
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const doInsertTable = () => {
    const html = insertTable(tableRows, tableCols);
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
    setShowTablePicker(false);
  };

  // ── NOTE DETAIL ──
  if (openNote && noteDraft) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => { if (editingNote) { if (!confirm("Сохранить изменения?")) { setEditingNote(false); } else { saveNote(); } } setOpenNote(null); }}
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
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {editingNote ? (
                    <>
                      {tags.map((t) => {
                        const active = noteDraft.tagIds.includes(t.id);
                        return (
                          <button key={t.id} type="button"
                            onClick={() => toggleNoteTag(t.id, noteDraft.tagIds, (v) => setNoteDraft({ ...noteDraft, tagIds: v }))}
                            className="font-lora text-xs px-2.5 py-1 rounded-full border"
                            style={active
                              ? { background: t.color, color: "#fff", borderColor: t.color }
                              : { background: "transparent", color: t.color, borderColor: `${t.color}60` }
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
                        <span key={tid} className="font-lora text-xs px-2.5 py-1 rounded-full border"
                          style={{ background: `${t.color}12`, color: t.color, borderColor: `${t.color}55` }}>
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

          {/* Rich editor toolbar */}
          {editingNote && (
            <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/10 flex-wrap">
              <button onClick={() => execCmd("bold")} title="Жирный (Ctrl+B)"
                className="px-2.5 py-1.5 rounded font-bold text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                Ж
              </button>
              <button onClick={() => execCmd("italic")} title="Курсив (Ctrl+I)"
                className="px-2.5 py-1.5 rounded italic text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                К
              </button>
              <button onClick={() => execCmd("underline")} title="Подчёркнутый (Ctrl+U)"
                className="px-2.5 py-1.5 rounded underline text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora">
                Ч
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={() => execCmd("insertUnorderedList")} title="Список"
                className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Icon name="List" size={13} />
              </button>
              <button onClick={() => execCmd("insertOrderedList")} title="Нумерованный список"
                className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Icon name="ListOrdered" size={13} />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              {/* Table picker */}
              <div className="relative">
                <button
                  onClick={() => setShowTablePicker((v) => !v)}
                  title="Вставить таблицу"
                  className="flex items-center gap-1 px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-lora text-xs">
                  <Icon name="Table" size={13} />
                  Таблица
                </button>
                {showTablePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-30 p-4 w-52">
                    <p className="font-lora text-xs text-muted-foreground mb-3">Размер таблицы</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <label className="font-lora text-[11px] text-muted-foreground block mb-1">Строки</label>
                        <input type="number" min={1} max={20} value={tableRows}
                          onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full border border-border rounded px-2 py-1 font-lora text-xs bg-background focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="font-lora text-[11px] text-muted-foreground block mb-1">Колонки</label>
                        <input type="number" min={1} max={10} value={tableCols}
                          onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full border border-border rounded px-2 py-1 font-lora text-xs bg-background focus:outline-none" />
                      </div>
                    </div>
                    <button onClick={doInsertTable}
                      className="w-full py-1.5 rounded-lg font-lora text-xs text-white transition-all"
                      style={{ background: 'hsl(var(--violet))' }}>
                      Вставить {tableRows}×{tableCols}
                    </button>
                  </div>
                )}
              </div>
              <div className="w-px h-4 bg-border mx-1" />
              <button onClick={() => execCmd("undo")} title="Отменить"
                className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Icon name="Undo2" size={13} />
              </button>
              <button onClick={() => execCmd("redo")} title="Повторить"
                className="px-2 py-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Icon name="Redo2" size={13} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-5">
            {editingNote ? (
              <div
                ref={editorRef}
                className="lore-editor w-full focus:outline-none scroll-custom"
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key === "b" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCmd("bold"); }
                  if (e.key === "i" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCmd("italic"); }
                  if (e.key === "u" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCmd("underline"); }
                }}
              />
            ) : (
              <div
                className="font-lora text-sm leading-7 text-foreground lore-editor"
                dangerouslySetInnerHTML={{ __html: openNote.text || '<span style="color: var(--muted-foreground); font-style: italic;">Заметка пуста</span>' }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по заметкам..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card font-lora text-sm focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': 'hsl(var(--violet))' } as React.CSSProperties}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <Icon name="X" size={13} />
          </button>
        )}
      </div>

      {/* Tags filter */}
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
            className="font-lora text-xs px-3 py-1.5 rounded-full border"
            style={activeTag === t.id
              ? { background: t.color, color: "#fff", borderColor: t.color }
              : { background: "transparent", color: t.color, borderColor: `${t.color}60` }
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
            <p className="font-lora text-sm text-muted-foreground line-clamp-2 mb-3">
              {noteToText(note.text)}
            </p>
            {note.tagIds.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {note.tagIds.map((tid) => {
                  const t = tagById(tid);
                  return t ? (
                    <span key={tid} className="font-lora text-[11px] px-2 py-0.5 rounded-full border"
                      style={{ background: `${t.color}12`, color: t.color, borderColor: `${t.color}55` }}>
                      {t.label}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </button>
        ))}

        {filtered.length === 0 && search && (
          <div className="col-span-2 py-10 text-center">
            <p className="font-lora text-sm text-muted-foreground">Ничего не найдено по запросу «{search}»</p>
          </div>
        )}

        <button onClick={() => setShowNewNote(true)}
          className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-24">
          <Icon name="FilePlus" size={20} className="text-muted-foreground group-hover:text-violet transition-colors" />
          <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
            Новая заметка
          </span>
        </button>
      </div>

      {/* TAG MANAGER MODAL */}
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
                      <button onClick={() => saveTagEdit(t.id)} className="text-violet hover:opacity-70 transition-opacity">
                        <Icon name="Check" size={14} />
                      </button>
                      <button onClick={() => setEditingTagId(null)} className="text-muted-foreground hover:text-foreground transition-colors">
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

      {/* NEW NOTE MODAL */}
      {showNewNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-7 w-full max-w-sm animate-slide-up">
            <h2 className="font-cormorant text-2xl mb-5">Новая заметка</h2>
            <div className="space-y-4">
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Название</label>
                <input value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNote()}
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
                        className="font-lora text-xs px-3 py-1.5 rounded-full border"
                        style={active
                          ? { background: t.color, color: "#fff", borderColor: t.color }
                          : { background: "transparent", color: t.color, borderColor: `${t.color}60` }
                        }>
                        {t.label}
                      </button>
                    );
                  })}
                  {tags.length === 0 && (
                    <button type="button" onClick={() => { setShowNewNote(false); setShowTagManager(true); }}
                      className="font-lora text-xs text-violet hover:opacity-70 transition-opacity flex items-center gap-1">
                      <Icon name="Tag" size={12} />
                      Ярлыков ещё нет — создать?
                    </button>
                  )}
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