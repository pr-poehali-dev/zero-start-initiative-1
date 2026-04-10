import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

interface Props {
  mode: "login" | "register";
  onSwitch: () => void;
  onBack: () => void;
}

export default function AuthPage({ mode, onSwitch, onBack }: Props) {
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={16} />
            <span className="font-cormorant text-2xl font-light text-violet tracking-widest">✦ Скрипторий</span>
          </button>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Decorative */}
          <div className="text-center mb-8">
            <div className="font-cormorant text-5xl text-violet/20 mb-3">✦</div>
            <h1 className="font-cormorant text-3xl font-light">
              {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
            </h1>
            <p className="font-lora text-sm text-muted-foreground mt-2">
              {mode === "login"
                ? "Войдите, чтобы продолжить работу над книгами"
                : "Начните писать свою историю сегодня"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="font-lora text-sm text-muted-foreground block mb-1.5">Имя</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как вас зовут?"
                  required
                  className="w-full border border-border rounded-xl px-4 py-3 font-lora text-sm bg-card focus:outline-none focus:ring-1 transition-all"
                  style={{ '--tw-ring-color': 'hsl(var(--violet))' } as React.CSSProperties}
                />
              </div>
            )}
            <div>
              <label className="font-lora text-sm text-muted-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border border-border rounded-xl px-4 py-3 font-lora text-sm bg-card focus:outline-none focus:ring-1 transition-all"
              />
            </div>
            <div>
              <label className="font-lora text-sm text-muted-foreground block mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
                  required
                  className="w-full border border-border rounded-xl px-4 py-3 pr-10 font-lora text-sm bg-card focus:outline-none focus:ring-1 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20 font-lora text-sm text-destructive">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-lora text-sm transition-all hover-lift disabled:opacity-60 mt-2"
              style={{ background: 'hsl(var(--violet))', color: 'hsl(var(--primary-foreground))' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "login" ? "Входим..." : "Создаём аккаунт..."}
                </span>
              ) : (
                mode === "login" ? "Войти" : "Зарегистрироваться"
              )}
            </button>
          </form>

          {/* Switch */}
          <p className="text-center font-lora text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}
            {" "}
            <button onClick={onSwitch} className="text-violet hover:opacity-80 transition-opacity">
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
