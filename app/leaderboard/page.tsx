"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { createClient } from "@/lib/supabase/client";
import { Player, Question } from "@/lib/types";

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .order("total_score", { ascending: false });

    if (playersError) {
      console.error("Error fetching players:", playersError);
    } else {
      setPlayers(playersData || []);
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("is_revealed", true)
      .order("question_order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
    } else {
      setQuestions(questionsData || []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const playerId = localStorage.getItem("player_id");
    if (playerId) {
      setCurrentPlayerId(playerId);
    }

    fetchData();

    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        () => fetchData()
      )
      .subscribe();

    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#6c6c6c]">Loading leaderboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      <Header />

      {/* Hero Banner */}
      <div className="bg-[#252525]">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2">LEADERBOARD</h1>
          <p className="text-[#999] text-sm">
            {players.length} player{players.length !== 1 ? "s" : ""} competing
          </p>
        </div>
      </div>

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Leaderboard */}
            <div className="md:col-span-2">
              <div className="espn-card overflow-hidden">
                <div className="bg-[#252525] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">RANKINGS</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchData}
                        className="text-[10px] text-white/60 hover:text-white transition-colors flex items-center gap-1"
                        title="Refresh leaderboard"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                      <span className="espn-badge espn-badge-green text-[10px]">LIVE</span>
                    </div>
                  </div>
                </div>
                <LeaderboardTable
                  players={players}
                  currentPlayerId={currentPlayerId || undefined}
                />
              </div>
            </div>

            {/* Revealed Questions Sidebar */}
            <div className="md:col-span-1">
              <div className="espn-card overflow-hidden">
                <div className="bg-[#252525] px-4 py-3">
                  <span className="text-white font-bold text-sm">REVEALED ANSWERS</span>
                </div>
                {questions.length === 0 ? (
                  <div className="p-4 text-center text-[#6c6c6c] text-sm">
                    No answers revealed yet
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8e8]">
                    {questions.map((question, index) => (
                      <div key={question.id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="espn-badge espn-badge-gray text-[10px]">Q{index + 1}</span>
                          <span className="espn-badge espn-badge-outline text-[10px]">{question.points} PTS</span>
                        </div>
                        <p className="text-sm text-[#484848] mb-2 line-clamp-2">
                          {question.question_text}
                        </p>
                        <div className="bg-[#e8f5e9] rounded px-3 py-2">
                          <div className="text-[10px] font-bold text-[#2e7d32] uppercase tracking-wide mb-0.5">
                            Answer
                          </div>
                          <div className="text-[#1b5e20] font-semibold text-sm">
                            {question.correct_answer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
