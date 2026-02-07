"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#d00] shadow-md">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center h-12 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center mr-8">
            <div className="bg-white rounded px-2 py-1">
              <span className="text-[#d00] font-black text-lg tracking-tight">
                SB TRIVIA
              </span>
            </div>
          </Link>

          {/* Navigation */}
          {showNav && (
            <nav className="flex items-center gap-1">
              <Link
                href="/play"
                className={`px-4 py-3 text-sm font-bold text-white hover:bg-white/20 rounded transition-colors ${
                  pathname?.startsWith("/play") ? "bg-white/20" : ""
                }`}
              >
                Play
              </Link>
              <Link
                href="/leaderboard"
                className={`px-4 py-3 text-sm font-bold text-white hover:bg-white/20 rounded transition-colors ${
                  pathname === "/leaderboard" ? "bg-white/20" : ""
                }`}
              >
                Leaderboard
              </Link>
              <Link
                href="/admin"
                className={`px-4 py-3 text-sm font-bold text-white hover:bg-white/20 rounded transition-colors ${
                  pathname?.startsWith("/admin") ? "bg-white/20" : ""
                }`}
              >
                Admin
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
