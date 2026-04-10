interface User {
  id: number;
  email: string;
  name: string;
}

interface Props {
  user: User;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-24 md:pb-10">
      <h1 className="font-cormorant text-4xl font-light mb-8">Профиль</h1>

      {/* Avatar & name */}
      <div className="flex items-center gap-5 mb-10 p-6 rounded-xl border border-border bg-card">
        <div className="w-16 h-16 rounded-full flex items-center justify-center font-cormorant text-3xl text-white"
          style={{ background: 'linear-gradient(135deg, hsl(267 50% 38%) 0%, hsl(270 40% 55%) 100%)' }}>
          {user.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-cormorant text-2xl font-medium">{user.name}</h2>
          <p className="font-lora text-sm text-muted-foreground">{user.email}</p>
        </div>
        <button onClick={onLogout}
          className="font-lora text-sm text-muted-foreground hover:text-destructive transition-colors border border-border hover:border-destructive/30 px-4 py-2 rounded-lg">
          Выйти
        </button>
      </div>

      {/* Settings */}
      <div className="space-y-5">
        <h3 className="font-cormorant text-xl font-light text-muted-foreground">Настройки</h3>

        {[
          { label: "Имя", value: user.name, type: "text" },
          { label: "Email", value: user.email, type: "email" },
          { label: "Псевдоним", value: "", type: "text" },
        ].map((field) => (
          <div key={field.label}>
            <label className="font-lora text-sm text-muted-foreground block mb-1.5">{field.label}</label>
            <input
              type={field.type}
              defaultValue={field.value}
              className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': 'hsl(var(--violet))' } as React.CSSProperties}
            />
          </div>
        ))}

        <div>
          <label className="font-lora text-sm text-muted-foreground block mb-1.5">О себе</label>
          <textarea
            rows={3}
            placeholder="Расскажите немного о себе и своём творчестве..."
            className="w-full border border-border rounded-lg px-3 py-2.5 font-lora text-sm bg-background resize-none focus:outline-none focus:ring-1 scroll-custom"
          />
        </div>

        <button
          className="w-full py-3 rounded-xl font-lora text-sm transition-all hover-lift"
          style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
          Сохранить изменения
        </button>
      </div>

      {/* Goals */}
      <div className="mt-10 p-6 rounded-xl border border-border bg-card">
        <h3 className="font-cormorant text-xl font-light mb-4">Цели на месяц</h3>
        <div className="space-y-4">
          {[
            { label: "Слов в день", current: 450, goal: 500 },
            { label: "Дней без пропусков", current: 12, goal: 30 },
          ].map((g) => (
            <div key={g.label}>
              <div className="flex justify-between font-lora text-sm mb-1.5">
                <span>{g.label}</span>
                <span className="text-muted-foreground">{g.current} / {g.goal}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${(g.current / g.goal) * 100}%`, background: 'hsl(var(--violet))' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
