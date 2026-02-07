"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { QuestionCard } from "@/components/QuestionCard";
import { createClient } from "@/lib/supabase/client";
import { QuestionWithAnswer, Question, Answer } from "@/lib/types";
import { toast } from "sonner";

export default function PlayQuestions() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);

  const fetchQuestionsAndAnswers = useCallback(async (pId: string) => {
    const supabase = createClient();

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("is_active", true)
      .order("question_order", { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      toast.error("Failed to load questions");
      return;
    }

    const { data: answersData, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("player_id", pId);

    if (answersError) {
      console.error("Error fetching answers:", answersError);
    }

    const { data: playerData } = await supabase
      .from("players")
      .select("total_score")
      .eq("id", pId)
      .single();

    if (playerData) {
      setTotalScore(playerData.total_score);
    }

    const questionsWithAnswers: QuestionWithAnswer[] = (questionsData || []).map(
      (question: Question) => {
        const playerAnswer = answersData?.find(
          (answer: Answer) => answer.question_id === question.id
        );
        return {
          ...question,
          player_answer: playerAnswer || null,
        };
      }
    );

    setQuestions(questionsWithAnswers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem("player_id");
    const storedPlayerName = localStorage.getItem("player_name");
    const storedJoinCode = localStorage.getItem("player_join_code");

    if (!storedPlayerId) {
      router.push("/play");
      return;
    }

    setPlayerId(storedPlayerId);
    setPlayerName(storedPlayerName || "Player");
    setJoinCode(storedJoinCode || "");

    fetchQuestionsAndAnswers(storedPlayerId);

    const supabase = createClient();
    const channel = supabase
      .channel("questions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        () => fetchQuestionsAndAnswers(storedPlayerId)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `player_id=eq.${storedPlayerId}`,
        },
        () => fetchQuestionsAndAnswers(storedPlayerId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, fetchQuestionsAndAnswers]);

  const handleLeaveGame = () => {
    localStorage.removeItem("player_id");
    localStorage.removeItem("player_name");
    localStorage.removeItem("player_join_code");
    router.push("/play");
  };

  const answeredCount = questions.filter((q) => q.player_answer).length;
  const revealedCount = questions.filter((q) => q.is_revealed).length;
  const correctCount = questions.filter((q) => q.player_answer?.is_correct).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#6c6c6c]">Loading questions...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      <Header />

      {/* Player Stats Bar */}
      <div className="bg-[#252525] border-b border-[#333]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-white font-bold text-lg">{playerName}</div>
                <div className="text-[#999] text-xs font-mono">{joinCode}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-[#999] text-[10px] uppercase tracking-wider font-semibold">Score</div>
                <div className="text-white font-black text-2xl">{totalScore}</div>
              </div>
              <div className="text-center">
                <div className="text-[#999] text-[10px] uppercase tracking-wider font-semibold">Correct</div>
                <div className="text-[#00c853] font-black text-2xl">{correctCount}/{revealedCount || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="espn-badge espn-badge-gray">
                {answeredCount}/{questions.length} ANSWERED
              </span>
              <span className="espn-badge espn-badge-outline">
                {revealedCount}/{questions.length} REVEALED
              </span>
            </div>
            <button
              onClick={handleLeaveGame}
              className="text-xs text-[#6c6c6c] hover:text-[#d00] font-semibold transition-colors"
            >
              LEAVE GAME
            </button>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="espn-card p-8 text-center">
              <div className="text-[#6c6c6c]">
                No questions yet. Wait for the host to add some!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  playerId={playerId!}
                  questionNumber={index + 1}
                  onAnswerSubmit={() => fetchQuestionsAndAnswers(playerId!)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Footer with Rejoin Code */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e8e8] shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-[#6c6c6c]">Your rejoin code: </span>
            <span className="font-mono font-bold text-[#121212]">{joinCode}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(joinCode);
              toast.success("Code copied!");
            }}
            className="espn-button-outline text-xs py-2 px-3"
          >
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
}
