"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  loginWithEmail as apiLogin,
  loginWithGoogle as apiGoogleLogin,
  registerWithEmail as apiRegister,
  type User,
} from "@/lib/api";

const TOKEN_KEY = "si_auth_token";
const USER_KEY = "si_auth_user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: (data: { credential?: string; email?: string; name?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Restaura sessão salva no localStorage ao carregar
  React.useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Valida silenciosamente em background se o token ainda é válido
        getCurrentUser(storedToken)
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          })
          .catch(() => {
            // Se expirou, limpa silenciosamente
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          });
      }
    } catch {
      // Ignora erro de parsing
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAuthSession = (authData: { user: User; token: string }) => {
    setToken(authData.token);
    setUser(authData.user);
    localStorage.setItem(TOKEN_KEY, authData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth-changed"));
      window.dispatchEvent(new CustomEvent("interviews-changed"));
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    saveAuthSession(data);
    router.push("/");
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiRegister(name, email, password);
    saveAuthSession(data);
    router.push("/");
  };

  const loginGoogle = async (googleData: {
    credential?: string;
    email?: string;
    name?: string;
  }) => {
    const data = await apiGoogleLogin(googleData);
    saveAuthSession(data);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth-changed"));
      window.dispatchEvent(new CustomEvent("interviews-changed"));
    }

    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

