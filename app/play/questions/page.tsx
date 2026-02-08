"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlayHeader } from "@/components/PlayHeader";
import { StatusStrip } from "@/components/StatusStrip";
import { QuestionCardV2 } from "@/components/QuestionCardV2";
import { InviteCode } from "@/components/InviteCode";
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  // Get current question status
  const currentQuestion = questions[currentQuestionIndex];
  const currentStatus = currentQuestion?.is_revealed ? "revealed" : "open";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading questions...
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
        <PlayHeader
          playerName={playerName}
          score={totalScore}
          correctCount={correctCount}
          revealedCount={revealedCount}
          onLeave={handleLeaveGame}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No questions yet</h2>
            <p className="text-gray-500">Wait for the host to add some questions!</p>
          </div>
        </main>
        <footer className="p-4">
          <InviteCode code={joinCode} />
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      {/* Header */}
      <PlayHeader
        playerName={playerName}
        score={totalScore}
        correctCount={correctCount}
        revealedCount={revealedCount}
        onLeave={handleLeaveGame}
      />

      {/* Status Strip */}
      <StatusStrip
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        status={currentStatus}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-[680px] mx-auto space-y-4">
          {/* Question Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {questions.map((q, index) => {
              const isAnswered = !!q.player_answer;
              const isRevealed = q.is_revealed;
              const isCorrect = q.player_answer?.is_correct;
              const isCurrent = index === currentQuestionIndex;

              let pillClass = "bg-gray-200 text-gray-600";
              if (isRevealed && isCorrect) {
                pillClass = "bg-green-100 text-green-700";
              } else if (isRevealed && !isCorrect && isAnswered) {
                pillClass = "bg-red-100 text-red-700";
              } else if (isRevealed) {
                pillClass = "bg-gray-300 text-gray-600";
              } else if (isAnswered) {
                pillClass = "bg-blue-100 text-blue-700";
              }

              if (isCurrent) {
                pillClass += " ring-2 ring-[#d00] ring-offset-2";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full font-semibold text-sm transition-all ${pillClass}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          {currentQuestion && (
            <QuestionCardV2
              question={currentQuestion}
              playerId={playerId!}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswerSubmit={() => {
                fetchQuestionsAndAnswers(playerId!);
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                }
              }}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Footer with Invite Code */}
      <footer className="border-t border-gray-200 bg-white p-4">
        <InviteCode code={joinCode} />
      </footer>
    </div>
  );
}
