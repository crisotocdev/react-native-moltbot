// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "./authStorage";

type AuthContextValue = {
    token: string | null;
    loading: boolean; // cargando sesión al abrir app
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [tokenState, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // auto-login al iniciar
        (async () => {
            try {
                const t = await getToken();
                setTokenState(t ?? null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            token: tokenState,
            loading,
            signIn: async (newToken: string) => {
                setTokenState(newToken);
                await setToken(newToken);
            },
            signOut: async () => {
                setTokenState(null);
                await clearToken();
            },
        }),
        [tokenState, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}