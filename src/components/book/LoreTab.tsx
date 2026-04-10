import { useState } from "react";
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

export default function LoreTab({ initialTags, initialNotes, onSaveTags, onSaveNotes }: {
  initialTags: string;
  initialNotes: string;
  onSaveTags: (v: string) => void;
  onSaveNotes: (v: string) => void;
}) {
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

  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState("");

  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteTags, setNewNoteTags] = useState<number[]>([]);

  const filtered = activeTag ? notes.filter((n) => n.tagIds.includes(activeTag)) : notes;
  const tagById = (id: number) => tags.find((t) => t.id === id);

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
    if (!noteDraft) return;
    const updated = notes.map((n) => n.id === noteDraft.id ? noteDraft : n);
    updateNotes(updated);
    setOpenNote(noteDraft);
    setEditingNote(false);
  };

  const deleteNote = (id: number) => {
    updateNotes(notes.filter((n) => n.id !== id));
    setOpenNote(null);
  };

  if (openNote && noteDraft) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => setOpenNote(null)}
          className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
          <Icon name="ArrowLeft" size={15} />
          Все заметки
        </button>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
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

  return (
    <div className="space-y-5 animate-fade-in">
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

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((note) => (
          <button key={note.id}
            onClick={() => openNoteDetail(note)}
            className="text-left group p-5 rounded-xl border border-border bg-card hover-lift transition-all">
            <h3 className="font-cormorant text-lg font-medium mb-1.5 group-hover:text-violet transition-colors">
              {note.title}
            </h3>
            <p className="font-lora text-sm text-muted-foreground line-clamp-2 mb-3">{note.text}</p>
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

        <button onClick={() => setShowNewNote(true)}
          className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-24">
          <Icon name="FilePlus" size={20} className="text-muted-foreground group-hover:text-violet transition-colors" />
          <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
            Новая заметка
          </span>
        </button>
      </div>

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