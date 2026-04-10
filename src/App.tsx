import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Icon from "@/components/ui/icon";
import HomePage from "@/pages/HomePage";
import BooksPage from "@/pages/BooksPage";
import StatsPage from "@/pages/StatsPage";
import ProfilePage from "@/pages/ProfilePage";
import HelpPage from "@/pages/HelpPage";

type Page = "home" | "books" | "stats" | "profile" | "help";

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "books", label: "Мои книги", icon: "BookOpen" },
  { id: "stats", label: "Статистика", icon: "BarChart2" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "help", label: "Справка", icon: "HelpCircle" },
];

const App = () => {
  const [page, setPage] = useState<Page>("home");

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`nav-link font-lora text-sm pb-0.5 transition-colors ${
                    page === item.id
                      ? "text-violet font-medium active"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 animate-fade-in" key={page}>
          {page === "home" && <HomePage onNavigate={setPage} />}
          {page === "books" && <BooksPage />}
          {page === "stats" && <StatsPage />}
          {page === "profile" && <ProfilePage />}
          {page === "help" && <HelpPage />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50">
          <div className="flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  page === item.id ? "text-violet" : "text-muted-foreground"
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="font-lora text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
};

export default App;
