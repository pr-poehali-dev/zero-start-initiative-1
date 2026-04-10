interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const features = [
  {
    icon: "📖",
    title: "Рукопись",
    desc: "Пишите прямо в браузере или загружайте текст. Главы считаются автоматически.",
  },
  {
    icon: "🗂",
    title: "Синопсис",
    desc: "Редактор синопсиса с подсчётом знаков по издательским нормам.",
  },
  {
    icon: "👤",
    title: "Персонажи",
    desc: "Карточки с фото, свободным описанием и подробной анкетой на 15 вопросов.",
  },
  {
    icon: "🗺",
    title: "Поэпизодный план",
    desc: "Структурируйте историю по пяти актам. Перемещайте эпизоды, отмечайте готовые.",
  },
  {
    icon: "✦",
    title: "Лор и заметки",
    desc: "Заметки по миру с цветными ярлыками и фильтрацией.",
  },
  {
    icon: "📊",
    title: "Статистика",
    desc: "Слова, знаки, прогресс по книгам, графики за неделю, месяц и год.",
  },
];

export default function LandingPage({ onLogin, onRegister }: Props) {
  return (
    <div className="min-h-screen bg-background font-lora">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <span className="font-cormorant text-xl md:text-2xl font-light text-violet tracking-widest whitespace-nowrap">
            ✦ Скрипторий
          </span>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={onLogin}
              className="font-lora text-sm text-muted-foreground hover:text-foreground transition-colors">
              Войти
            </button>
            <button onClick={onRegister}
              className="px-3 md:px-4 py-2 rounded-xl font-lora text-xs md:text-sm transition-all hover-lift whitespace-nowrap"
              style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
              <span className="hidden sm:inline">Начать бесплатно</span>
              <span className="sm:hidden">Начать</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="font-cormorant text-lg italic text-muted-foreground mb-4 animate-fade-in">
          помощник для писателей
        </p>
        <h1 className="font-cormorant text-6xl md:text-7xl font-light leading-tight mb-6 animate-slide-up"
          style={{ animationDelay: '0.1s' }}>
          Место, где<br />
          <span className="text-violet">рождаются книги</span>
        </h1>
        <p className="font-lora text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ animationDelay: '0.2s' }}>
          Скрипторий — рабочее пространство для авторов художественной прозы.
          Рукопись и все материалы в одном месте.
        </p>
        <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button onClick={onRegister}
            className="px-8 py-4 rounded-xl font-lora text-base transition-all hover-lift"
            style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
            Создать аккаунт — бесплатно
          </button>
          <button onClick={onLogin}
            className="px-8 py-4 rounded-xl font-lora text-base border border-border hover:bg-muted transition-colors">
            Уже есть аккаунт
          </button>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="max-w-5xl mx-auto px-6 flex items-center gap-4 mb-16">
        <div className="flex-1 h-px bg-border" />
        <span className="font-cormorant text-xl text-muted-foreground/40">✦ ✦ ✦</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="font-cormorant text-3xl font-light text-center mb-10">Всё для вашей книги</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title}
              className="p-6 rounded-xl border border-border bg-card hover-lift transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-cormorant text-xl font-medium mb-2">{f.title}</h3>
              <p className="font-lora text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="font-cormorant text-4xl font-light mb-4">Готовы начать писать?</h2>
          <p className="font-lora text-sm text-muted-foreground mb-8">Регистрация бесплатна.</p>
          <button onClick={onRegister}
            className="px-8 py-4 rounded-xl font-lora text-base transition-all hover-lift"
            style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
            ✦ Открыть Скрипторий
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center">
        <span className="font-lora text-xs text-muted-foreground">
          © 2026 Скрипторий — рабочее пространство для писателей
        </span>
      </footer>
    </div>
  );
}