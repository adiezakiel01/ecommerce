'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(username, password);
        } catch {
            setError('Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemo = (user: string, pass: string) => {
        setUsername(user);
        setPassword(pass);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-xl font-semibold text-gray-900">Ecom Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">AI-powered e-commerce dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Demo accounts (click to fill):</p>
                    <div className="space-y-1">
                        <button onClick={() => fillDemo('admin', 'admin123')} className="block w-full text-left text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                            <span className="font-medium">admin</span> / admin123 — full access
                        </button>
                        <button onClick={() => fillDemo('analyst', 'analyst123')} className="block w-full text-left text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                            <span className="font-medium">analyst</span> / analyst123 — analytics + forecasting
                        </button>
                        <button onClick={() => fillDemo('viewer', 'viewer123')} className="block w-full text-left text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                            <span className="font-medium">viewer</span> / viewer123 — read only
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}