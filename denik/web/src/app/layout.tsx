import Link from 'next/link';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand2Print Pipeline",
  description: "Interactive pipeline for brand-to-print notebook design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-full bg-gray-900 text-white antialiased">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B2P</span>
              </div>
              <h1 className="text-xl font-semibold">Brand2Print Pipeline</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/pipelines" className="text-gray-300 hover:text-white transition-colors">
                All Pipelines
              </Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
                Docs
              </Link>
            </nav>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
          Brand2Print Pipeline - Powered by LangGraph & Next.js
        </footer>
      </body>
    </html>
  );
}
