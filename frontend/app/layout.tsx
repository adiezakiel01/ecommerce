import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Commerce Analytics Dashboard",
  description: "AI-powered analytics dashboard for e-commerce businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
          <body className={inter.className}>
              <AuthProvider>
                  <div className="flex h-screen bg-gray-50">
                      <Sidebar />
                      <main className="flex-1 overflow-y-auto">
                          {children}
                      </main>
                  </div>
              </AuthProvider>
          </body>
      </html>
  );
}