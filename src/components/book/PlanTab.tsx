import { useState } from "react";
import Icon from "@/components/ui/icon";
import * as XLSX from "xlsx";

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

export default function PlanTab({ bookId, initialData, onSave }: { bookId: number; initialData: string; onSave: (v: string) => void }) {
  const parseInitial = (): PlanSection[] => {
    try { if (initialData) return JSON.parse(initialData); } catch (_e) { /* ignore */ }
    return [];
  };
  const saveSections = (secs: PlanSection[]) => {
    onSave(JSON.stringify(secs));
  };

  const [sections, setSections] = useState<PlanSection[]>(() => {
    const saved = parseInitial();
    return saved.length > 0 ? saved : PLAN_SECTIONS_DEFAULT.map((s) => ({ ...s, episodes: [] }));
  });
  const [editingEp, setEditingEp] = useState<{ sectionId: string; ep: PlanEpisode } | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const totalEps = sections.reduce((s, sec) => s + sec.episodes.length, 0);
  const doneEps  = sections.reduce((s, sec) => s + sec.episodes.filter((e) => e.done).length, 0);

  const updateSections = (updated: PlanSection[]) => {
    setSections(updated);
    saveSections(updated);
  };

  const toggleDone = (sectionId: string, epId: number) => {
    updateSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : {
        ...sec,
        episodes: sec.episodes.map((e) => e.id === epId ? { ...e, done: !e.done } : e),
      }
    ));
  };

  const addEpisode = (sectionId: string) => {
    if (!newTitle.trim()) return;
    const ep: PlanEpisode = { id: Date.now(), title: newTitle.trim(), description: newDesc.trim(), done: false };
    updateSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : { ...sec, episodes: [...sec.episodes, ep] }
    ));
    setAddingTo(null);
    setNewTitle(""); setNewDesc("");
  };

  const saveEdit = () => {
    if (!editingEp) return;
    const { sectionId, newSectionId, ep } = editingEp as typeof editingEp & { newSectionId: string };
    let updated: PlanSection[];
    if (newSectionId && newSectionId !== sectionId) {
      updated = sections.map((sec) => {
        if (sec.id === sectionId) return { ...sec, episodes: sec.episodes.filter((e) => e.id !== ep.id) };
        if (sec.id === newSectionId) return { ...sec, episodes: [...sec.episodes, ep] };
        return sec;
      });
    } else {
      updated = sections.map((sec) =>
        sec.id !== sectionId ? sec : {
          ...sec,
          episodes: sec.episodes.map((e) => e.id === ep.id ? ep : e),
        }
      );
    }
    updateSections(updated);
    setEditingEp(null);
  };

  const deleteEp = (sectionId: string, epId: number) => {
    updateSections(sections.map((sec) =>
      sec.id !== sectionId ? sec : { ...sec, episodes: sec.episodes.filter((e) => e.id !== epId) }
    ));
    setEditingEp(null);
  };

  const moveEp = (sectionId: string, epId: number, dir: -1 | 1) => {
    updateSections(sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const eps = [...sec.episodes];
      const idx = eps.findIndex((e) => e.id === epId);
      const next = idx + dir;
      if (next < 0 || next >= eps.length) return sec;
      [eps[idx], eps[next]] = [eps[next], eps[idx]];
      return { ...sec, episodes: eps };
    }));
  };

  const exportExcel = () => {
    const rows: object[] = [];
    sections.forEach((sec) => {
      rows.push({ Часть: sec.label, Подзаголовок: sec.subtitle, Эпизод: "", Описание: "", Статус: "" });
      sec.episodes.forEach((ep) => {
        rows.push({ Часть: sec.label, Подзаголовок: "", Эпизод: ep.title, Описание: ep.description, Статус: ep.done ? "✓ Готово" : "В работе" });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 18 }, { wch: 30 }, { wch: 28 }, { wch: 50 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "План");
    XLSX.writeFile(wb, "план.xlsx");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-1 mb-1">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${totalEps ? (doneEps / totalEps) * 100 : 0}%`, background: 'hsl(var(--violet))' }} />
        </div>
        <span className="font-lora text-xs text-muted-foreground">{doneEps} / {totalEps} эпизодов</span>
        <button onClick={exportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border font-lora text-xs text-muted-foreground hover:text-violet hover:border-violet/50 transition-colors">
          <Icon name="Download" size={13} />
          Excel
        </button>
      </div>

      {sections.map((sec) => (
        <div key={sec.id} className="rounded-xl border border-border overflow-hidden">
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

          {sec.episodes.length > 0 && (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-[2rem_1fr_2fr_5rem] gap-3 px-4 py-2 bg-muted/30">
                <div />
                <span className="font-lora text-[11px] text-muted-foreground uppercase tracking-wide">Название</span>
                <span className="font-lora text-[11px] text-muted-foreground uppercase tracking-wide">Описание</span>
                <div />
              </div>
              {sec.episodes.map((ep, epIdx) => (
                <div key={ep.id}
                  className={`grid grid-cols-[2rem_1fr_2fr_6rem] gap-3 px-4 py-3 items-start transition-colors ${ep.done ? "bg-muted/20" : "bg-card"}`}>
                  <button onClick={() => toggleDone(sec.id, ep.id)}
                    className="mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                    style={ep.done
                      ? { background: sec.color, borderColor: sec.color }
                      : { background: "transparent", borderColor: 'hsl(var(--border))' }
                    }>
                    {ep.done && <Icon name="Check" size={11} className="text-white" />}
                  </button>
                  <span className={`font-lora text-sm leading-snug ${ep.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {ep.title}
                  </span>
                  <span className="font-lora text-xs text-muted-foreground leading-relaxed">{ep.description}</span>
                  <div className="flex items-center gap-0.5 justify-end">
                    <button onClick={() => moveEp(sec.id, ep.id, -1)} disabled={epIdx === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                      <Icon name="ChevronUp" size={13} />
                    </button>
                    <button onClick={() => moveEp(sec.id, ep.id, 1)} disabled={epIdx === sec.episodes.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                      <Icon name="ChevronDown" size={13} />
                    </button>
                    <button onClick={() => setEditingEp({ sectionId: sec.id, ep })}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Icon name="Pencil" size={13} />
                    </button>
                    <button onClick={() => deleteEp(sec.id, ep.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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