"use client";

import Link from "next/link";

interface PlayHeaderProps {
  playerName: string;
  score: number;
  correctCount: number;
  revealedCount: number;
  onLeave: () => void;
}

export function PlayHeader({
  playerName,
  score,
  correctCount,
  revealedCount,
  onLeave,
}: PlayHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#d00] rounded flex items-center justify-center">
            <span className="text-white font-black text-xs">SB</span>
          </div>
          <span className="font-bold text-gray-900 hidden sm:block">Super Bowl Trivia</span>
        </Link>

        {/* Stats + Actions */}
        <div className="flex items-center gap-3">
          {/* Score Chip */}
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4 text-[#d00]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">{score}</span>
          </div>

          {/* Correct Chip */}
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold text-green-700">
              {correctCount}/{revealedCount > 0 ? revealedCount : "-"}
            </span>
          </div>

          {/* Player dropdown / name */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                {playerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">{playerName}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={onLeave}
            className="text-sm text-gray-500 hover:text-[#d00] transition-colors ml-2"
          >
            Leave
          </button>
        </div>
      </div>
    </header>
  );
}
