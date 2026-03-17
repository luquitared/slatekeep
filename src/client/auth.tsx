import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authMe, setSession } from "./api";

interface UserInfo {
  id: string;
  username: string | null;
  display_name: string;
  is_anonymous: boolean;
}

interface AuthCtx {
  user: UserInfo | null;
  loading: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const session = localStorage.getItem("session");
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await authMe();
      setUser(u);
    } catch {
      setSession(null);
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = (token: string, u: UserInfo) => {
    setSession(token);
    setUser(u);
  };

  const logout = () => {
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
