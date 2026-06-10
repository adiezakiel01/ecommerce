import type { Metadata } from "next";
import {Inter} from "next/font/google";
//import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";

/*const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});*/

const inter = Inter({ subsets: ["latin"] }); 

export const metadata: Metadata = {
  title: "E-Commerce Analytics Dashboard",
  description: "AI-powered analytics dashboard for e-commerce businesses",
};

// Navigation items for the sidebar
const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/chat", label: "AI Chat" },
  //{ name: "Orders", href: "/orders" },
  //{ name: "Customers", href: "/customers" },
  //{ name: "Settings", href: "/settings" },
]; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
          <body className={inter.className}>
              <div className="flex h-screen bg-gray-50">

                  <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
                      <div className="h-14 flex items-center px-5 border-b border-gray-200">
                          <span className="font-semibold text-gray-900">
                              Ecom Analytics
                          </span>
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

                      <div className="p-4 border-t border-gray-100">
                          <p className="text-xs text-gray-400">v1.0.0</p>
                      </div>
                  </aside>

                  <main className="flex-1 overflow-y-auto">
                      {children}
                  </main>

              </div>
          </body>
      </html>
  );
}
