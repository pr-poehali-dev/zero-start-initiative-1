import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/abccaa69-33e5-4e29-bbbd-633c65210599";
const TOKEN_KEY = "scriptorium_token";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token },
      body: JSON.stringify({ action: "me" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка входа");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
