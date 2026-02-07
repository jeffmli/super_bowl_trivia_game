"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
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
  const [gameCode, setGameCode] = useState("");
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
    if (!name.trim() || !gameCode.trim()) return;

    setIsJoining(true);
    const supabase = createClient();

    try {
      const { data: settings, error: settingsError } = await supabase
        .from("game_settings")
        .select("setting_value")
        .eq("setting_key", "share_code")
        .single();

      if (settingsError) throw settingsError;

      if (settings.setting_value.toLowerCase() !== gameCode.trim().toLowerCase()) {
        toast.error("Invalid game code");
        setIsJoining(false);
        return;
      }

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
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">
              SUPER BOWL TRIVIA
            </h1>
            <p className="text-[#999] text-sm">
              Test your football knowledge against friends
            </p>
          </div>

          {!showRejoin ? (
            <div className="espn-card p-6">
              <div className="espn-section-header">Join Game</div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="espn-input w-full"
                    disabled={isJoining}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label
                    htmlFor="gameCode"
                    className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2"
                  >
                    Game Code
                  </label>
                  <input
                    id="gameCode"
                    type="text"
                    placeholder="e.g., BOWL25"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    className="espn-input w-full font-mono uppercase"
                    disabled={isJoining}
                    maxLength={20}
                  />
                </div>

                <button
                  type="submit"
                  className="espn-button w-full"
                  disabled={!name.trim() || !gameCode.trim() || isJoining}
                >
                  {isJoining ? "Joining..." : "Join Game"}
                </button>
              </form>

              <div className="espn-divider" />

              <button
                onClick={() => setShowRejoin(true)}
                className="w-full text-center text-sm text-[#6c6c6c] hover:text-[#d00] transition-colors"
              >
                Returning player? <span className="font-semibold">Click to rejoin</span>
              </button>
            </div>
          ) : (
            <div className="espn-card p-6">
              <div className="espn-section-header">Rejoin Game</div>

              <form onSubmit={handleRejoin} className="space-y-4">
                <div>
                  <label
                    htmlFor="rejoinCode"
                    className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2"
                  >
                    Your Rejoin Code
                  </label>
                  <input
                    id="rejoinCode"
                    type="text"
                    placeholder="e.g., JOHN-A1B2"
                    value={rejoinCode}
                    onChange={(e) => setRejoinCode(e.target.value.toUpperCase())}
                    className="espn-input w-full font-mono uppercase"
                    disabled={isRejoining}
                    maxLength={20}
                  />
                </div>

                <button
                  type="submit"
                  className="espn-button w-full"
                  disabled={!rejoinCode.trim() || isRejoining}
                >
                  {isRejoining ? "Rejoining..." : "Rejoin Game"}
                </button>
              </form>

              <div className="espn-divider" />

              <button
                onClick={() => setShowRejoin(false)}
                className="w-full text-center text-sm text-[#6c6c6c] hover:text-[#d00] transition-colors"
              >
                New player? <span className="font-semibold">Click to join</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
