'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/products', label: 'Products' },
    { href: '/forecasting', label: 'Forecasting' },
    { href: '/chat', label: 'AI Chat' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (pathname === '/login') return null;

    return (
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
            <div className="h-14 flex items-center px-5 border-b border-gray-200">
                <span className="font-semibold text-gray-900">Ecom Analytics</span>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            {user && (
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{user.username}</p>
                            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full text-xs text-gray-500 hover:text-gray-900 text-left"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </aside>
    );
}