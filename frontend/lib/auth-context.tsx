'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, getToken, setToken, clearToken, CurrentUser } from './api';

interface AuthContextType {
    user: CurrentUser | null;
    loading: boolean;  
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                if (!PUBLIC_PATHS.includes(pathname)) {
                    router.push('/login');
                }
                return;
            }
            try {
                const me = await authApi.getMe();
                setUser(me);
            } catch {
                clearToken();
                if (!PUBLIC_PATHS.includes(pathname)) {
                    router.replace('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    
    }, [pathname]);

    const login = async (username: string, password: string) => {
        const res = await authApi.login(username, password);
        setToken(res.access_token);
        const me = await authApi.getMe();
        setUser(me);
        router.replace('/dashboard');
    };

    const logout = () => {
        clearToken();
        setUser(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}