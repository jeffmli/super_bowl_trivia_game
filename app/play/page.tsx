"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function generateJoinCode(name: string): string {
  const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

export default function PlayJoin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rejoinCode, setRejoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const [showRejoin, setShowRejoin] = useState(false);

  useEffect(() => {
    const playerId = localStorage.getItem("player_id");
    if (playerId) {
      router.push("/play/questions");
    }
  }, [router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsJoining(true);
    const supabase = createClient();

    try {
      const joinCode = generateJoinCode(name.trim());
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          name: name.trim(),
          join_code: joinCode,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      localStorage.setItem("player_id", player.id);
      localStorage.setItem("player_name", player.name);
      localStorage.setItem("player_join_code", player.join_code);

      toast.success(`Welcome, ${player.name}!`);
      router.push("/play/questions");
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleRejoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejoinCode.trim()) return;

    setIsRejoining(true);
    const supabase = createClient();

    try {
      const { data: player, error } = await supabase
        .from("players")
        .select("*")
        .eq("join_code", rejoinCode.trim().toUpperCase())
        .single();

      if (error || !player) {
        toast.error("Invalid rejoin code");
        setIsRejoining(false);
        return;
      }

      localStorage.setItem("player_id", player.id);
      localStorage.setItem("player_name", player.name);
      localStorage.setItem("player_join_code", player.join_code);

      toast.success(`Welcome back, ${player.name}!`);
      router.push("/play/questions");
    } catch (error) {
      console.error("Error rejoining:", error);
      toast.error("Failed to rejoin. Please try again.");
    } finally {
      setIsRejoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#d00] rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">SB</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Super Bowl Trivia</span>
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-gray-600 hover:text-[#d00] transition-colors"
          >
            View Leaderboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#d00] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-black text-2xl">SB</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              2026 Super Bowl Trivia
            </h1>
            <p className="text-gray-500 text-base">
              The best game to get everyone excited for the super bowl.
            </p>
          </div>

          {/* Join Card */}
          {!showRejoin ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Join Game</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your name to start playing</p>
              </div>

              <div className="p-6">
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isJoining}
                      maxLength={100}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d00] focus:ring-1 focus:ring-[#d00] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!name.trim() || isJoining}
                    className="w-full py-3 px-4 bg-[#d00] text-white font-semibold rounded-lg hover:bg-[#b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                  >
                    {isJoining ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      "Join Game"
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowRejoin(true)}
                  className="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                >
                  Returning Player? Rejoin Game
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Welcome Back</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your rejoin code to continue</p>
              </div>

              <div className="p-6">
                <form onSubmit={handleRejoin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="rejoinCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Your Rejoin Code
                    </label>
                    <input
                      id="rejoinCode"
                      type="text"
                      placeholder="e.g., JOHN-A1B2"
                      value={rejoinCode}
                      onChange={(e) => setRejoinCode(e.target.value.toUpperCase())}
                      disabled={isRejoining}
                      maxLength={20}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 font-mono uppercase focus:outline-none focus:border-[#d00] focus:ring-1 focus:ring-[#d00] transition-colors"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      This is the code shown after you first joined
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!rejoinCode.trim() || isRejoining}
                    className="w-full py-3 px-4 bg-[#d00] text-white font-semibold rounded-lg hover:bg-[#b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                  >
                    {isRejoining ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Rejoining...
                      </span>
                    ) : (
                      "Rejoin Game"
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowRejoin(false)}
                  className="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                >
                  New Player? Join Game
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white p-4">
        <p className="text-center text-sm text-gray-500">
          Play with friends and see who knows football best
        </p>
      </footer>
    </div>
  );
}
