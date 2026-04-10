import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import BooksPage from "@/pages/BooksPage";
import StatsPage from "@/pages/StatsPage";
import ProfilePage from "@/pages/ProfilePage";
import HelpPage from "@/pages/HelpPage";

type Page = "home" | "books" | "stats" | "profile" | "help";
type Screen = "landing" | "login" | "register";

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "books", label: "Мои книги", icon: "BookOpen" },
  { id: "stats", label: "Статистика", icon: "BarChart2" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "help", label: "Справка", icon: "HelpCircle" },
];

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState<Page>("home");
  const [screen, setScreen] = useState<Screen>("landing");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="font-cormorant text-4xl text-violet mb-4">✦</div>
          <div className="w-6 h-6 border-2 mx-auto rounded-full animate-spin"
            style={{ borderColor: 'hsl(var(--violet) / 0.3)', borderTopColor: 'hsl(var(--violet))' }} />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    if (screen === "login") {
      return <AuthPage mode="login" onSwitch={() => setScreen("register")} onBack={() => setScreen("landing")} />;
    }
    if (screen === "register") {
      return <AuthPage mode="register" onSwitch={() => setScreen("login")} onBack={() => setScreen("landing")} />;
    }
    return <LandingPage onLogin={() => setScreen("login")} onRegister={() => setScreen("register")} />;
  }

  // Logged in — main app
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => setPage("home")} className="flex items-center gap-2">
            <span className="font-cormorant text-2xl font-light text-violet" style={{ letterSpacing: '0.18em' }}>
              ✦ Скрипторий
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id)}
                className={`nav-link font-lora text-sm pb-0.5 transition-colors ${
                  page === item.id ? "text-violet font-medium active" : "text-muted-foreground hover:text-foreground"
                }`}>
                {item.label}
              </button>
            ))}
          </nav>

          {/* User + logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-cormorant text-sm font-medium text-white"
              style={{ background: 'hsl(var(--violet))' }}>
              {user.name[0].toUpperCase()}
            </div>
            <button onClick={logout}
              className="font-lora text-xs text-muted-foreground hover:text-foreground transition-colors">
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 animate-fade-in" key={page}>
        {page === "home" && <HomePage onNavigate={setPage} />}
        {page === "books" && <BooksPage />}
        {page === "stats" && <StatsPage />}
        {page === "profile" && <ProfilePage user={user} onLogout={logout} />}
        {page === "help" && <HelpPage />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50">
        <div className="flex">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                page === item.id ? "text-violet" : "text-muted-foreground"
              }`}>
              <Icon name={item.icon} size={18} />
              <span className="font-lora text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppInner />
    </TooltipProvider>
  </AuthProvider>
);

export default App;
