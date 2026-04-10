import { useState } from "react";
import Icon from "@/components/ui/icon";

const faqs = [
  {
    q: "Как создать новую книгу?",
    a: "Перейдите в раздел «Мои книги» и нажмите «Новая книга». Введите название и жанр — и можно начинать писать.",
  },
  {
    q: "Как работает подсчёт слов?",
    a: "Слова считаются автоматически в режиме рукописи. Главы определяются по заголовкам вида «Глава 1», «Глава 2» и т.д.",
  },
  {
    q: "Что такое синопсис и как его сгенерировать?",
    a: "Синопсис — краткое изложение сюжета книги. Перейдите в книгу → вкладка «Синопсис» → нажмите «Сгенерировать». ИИ составит синопсис на основе вашей рукописи.",
  },
  {
    q: "Как добавить персонажа?",
    a: "Откройте книгу, перейдите на вкладку «Персонажи» и нажмите «Добавить персонажа». Можно заполнить имя, роль и описание.",
  },
  {
    q: "Сохраняются ли тексты автоматически?",
    a: "Да, все изменения сохраняются автоматически по мере набора текста.",
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-24 md:pb-10">
      <h1 className="font-cormorant text-4xl font-light mb-2">Справка</h1>
      <p className="font-lora text-sm text-muted-foreground mb-10">Ответы на частые вопросы</p>

      {/* FAQ */}
      <div className="space-y-2 mb-12">
        {faqs.map((item, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="font-lora text-sm font-medium pr-4">{item.q}</span>
              <Icon
                name="ChevronDown"
                size={16}
                className={`text-muted-foreground flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-4 animate-slide-up">
                <p className="font-lora text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="p-6 rounded-xl border border-border bg-card text-center">
        <div className="font-cormorant text-xl mb-2">Не нашли ответ?</div>
        <p className="font-lora text-sm text-muted-foreground mb-4">
          Напишите нам — ответим в течение дня.
        </p>
        <button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-lora text-sm transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Icon name="MessageCircle" size={16} />
          Написать в поддержку
        </button>
      </div>
    </div>
  );
}
