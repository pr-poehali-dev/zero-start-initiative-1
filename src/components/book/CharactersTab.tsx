import { useState } from "react";
import Icon from "@/components/ui/icon";

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

export default function CharactersTab({ bookId, initialData, onSave }: { bookId: number; initialData: string; onSave: (v: string) => void }) {
  const parseInitial = (): Character[] => {
    try { if (initialData) return JSON.parse(initialData); } catch (_e) { /* ignore */ }
    return [];
  };
  const saveChars = (chars: Character[]) => {
    const sanitized = chars.map((c) => ({
      ...c,
      photo: c.photo?.startsWith('data:') ? null : c.photo,
    }));
    onSave(JSON.stringify(sanitized));
  };

  const [characters, setCharacters] = useState<Character[]>(parseInitial);
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
    const updated = characters.map((c) => (c.id === draft.id ? draft : c));
    setCharacters(updated);
    saveChars(updated);
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
    const updated = [...characters, nc];
    setCharacters(updated);
    saveChars(updated);
    setShowNew(false);
    setNewName("");
    openCard(nc, "card");
    setEditing(true);
  };

  const deleteCharacter = (id: number) => {
    const updated = characters.filter((c) => c.id !== id);
    setCharacters(updated);
    saveChars(updated);
    setView("list");
    setSelected(null);
  };

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
                    <span className="font-lora text-xs px-2 py-0.5 rounded-full inline-block border"
                      style={{ background: `${color}18`, color, borderColor: `${color}55` }}>
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

          <button onClick={() => setShowNew(true)}
            className="p-5 rounded-xl border-2 border-dashed border-border hover:border-violet transition-colors group flex flex-col items-center justify-center gap-2 min-h-32">
            <Icon name="UserPlus" size={22} className="text-muted-foreground group-hover:text-violet transition-colors" />
            <span className="font-lora text-sm text-muted-foreground group-hover:text-violet transition-colors">
              Добавить персонажа
            </span>
          </button>
        </div>

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
                    {ROLES.map((r) => {
                      const isActive = newRole === r.label;
                      return (
                        <button key={r.label} type="button"
                          onClick={() => setNewRole(r.label)}
                          className="font-lora text-xs px-3 py-1.5 rounded-full border transition-all"
                          style={isActive
                            ? { background: r.color, color: "#fff", borderColor: r.color }
                            : { background: "transparent", color: r.color, borderColor: `${r.color}60` }
                          }>
                          {r.label}
                        </button>
                      );
                    })}
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

  return (
    <div className="animate-fade-in">
      <button onClick={() => setView("list")}
        className="flex items-center gap-1.5 font-lora text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <Icon name="ArrowLeft" size={15} />
        Все персонажи
      </button>

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
              {ROLES.map((r) => {
                const isActive = draft.role === r.label;
                return (
                  <button key={r.label} type="button"
                    onClick={() => setDraft({ ...draft, role: r.label })}
                    className="font-lora text-xs px-2.5 py-1 rounded-full border transition-all"
                    style={isActive
                      ? { background: r.color, color: "#fff", borderColor: r.color }
                      : { background: "transparent", color: r.color, borderColor: `${r.color}60` }
                    }>
                    {r.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="font-lora text-xs px-2.5 py-0.5 rounded-full mt-1 inline-block border"
              style={{ background: `${color}12`, color, borderColor: `${color}55` }}>
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
            <>
              <button onClick={saveEdits}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-lora text-xs text-white transition-colors"
                style={{ background: 'hsl(var(--violet))' }}>
                <Icon name="Check" size={13} />
                Сохранить
              </button>
              <button onClick={() => { setDraft({ ...selected, questionnaire: { ...selected.questionnaire } }); setEditing(false); }}
                className="px-3 py-2 rounded-lg border border-border font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
                Отмена
              </button>
            </>
          )}
          <button onClick={() => deleteCharacter(selected.id)}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
            <Icon name="Trash2" size={13} />
          </button>
        </div>
      </div>

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

      {view === "card" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
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

      {view === "questionnaire" && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--violet) / 0.3)' }}>
          <div className="px-7 py-6" style={{ background: 'linear-gradient(135deg, hsl(267 50% 30%) 0%, hsl(267 45% 42%) 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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

          <div className="px-6 py-3 border-t border-border flex justify-between items-center bg-muted/20">
            <span className="font-cormorant text-xs italic text-muted-foreground">Скрипторий · Анкета персонажа</span>
            <span className="font-lora text-xs text-muted-foreground">{new Date().getFullYear()}</span>
          </div>
        </div>
      )}
    </div>
  );
}