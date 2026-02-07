"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Question, Answer, Player, QuestionType } from "@/lib/types";
import { toast } from "sonner";

interface AnswerWithPlayer extends Answer {
  player: Player;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newPoints, setNewPoints] = useState(10);
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>("freeform");
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [playerCount, setPlayerCount] = useState(0);

  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState<AnswerWithPlayer[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetQuestions, setResetQuestions] = useState(false);

  const fetchQuestions = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("question_order", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } else {
      setQuestions(data || []);
    }
    setIsLoading(false);
  }, []);

  const fetchShareCode = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("game_settings")
      .select("setting_value")
      .eq("setting_key", "share_code")
      .single();

    if (data) {
      setShareCode(data.setting_value);
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    const supabase = createClient();
    const { data, count } = await supabase
      .from("players")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    setPlayers(data || []);
    setPlayerCount(count || 0);
  }, []);

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete player "${playerName}"?`)) return;

    const supabase = createClient();

    try {
      // Delete player's answers first
      await supabase.from("answers").delete().eq("player_id", playerId);
      // Then delete the player
      const { error } = await supabase.from("players").delete().eq("id", playerId);

      if (error) throw error;

      toast.success(`Player "${playerName}" deleted`);
      fetchPlayers();
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
    }
  };

  const handleResetGame = async () => {
    setIsResetting(true);
    const supabase = createClient();

    try {
      // Delete all answers
      await supabase.from("answers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Delete all players
      await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (resetQuestions) {
        // Delete all questions if checkbox is checked
        await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        // Reset questions to unrevealed state
        await supabase
          .from("questions")
          .update({ is_revealed: false, correct_answer: null })
          .neq("id", "00000000-0000-0000-0000-000000000000");
      }

      toast.success("Game reset successfully!");
      setResetDialogOpen(false);
      setResetQuestions(false);
      fetchQuestions();
      fetchPlayers();
    } catch (error) {
      console.error("Error resetting game:", error);
      toast.error("Failed to reset game");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated");
    const authTime = localStorage.getItem("admin_auth_time");

    if (!isAuthenticated || !authTime) {
      router.push("/admin");
      return;
    }

    const hoursSinceAuth = (Date.now() - parseInt(authTime)) / (1000 * 60 * 60);
    if (hoursSinceAuth > 24) {
      localStorage.removeItem("admin_authenticated");
      localStorage.removeItem("admin_auth_time");
      router.push("/admin");
      return;
    }

    fetchQuestions();
    fetchShareCode();
    fetchPlayers();
  }, [router, fetchQuestions, fetchShareCode, fetchPlayers]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    // Validate multiple choice options
    if (newQuestionType === "multiple_choice") {
      const validOptions = newOptions.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        toast.error("Please add at least 2 options for multiple choice");
        return;
      }
    }

    setIsAddingQuestion(true);
    const supabase = createClient();

    try {
      const nextOrder = questions.length > 0
        ? Math.max(...questions.map(q => q.question_order)) + 1
        : 1;

      const options = newQuestionType === "multiple_choice"
        ? newOptions.filter(opt => opt.trim() !== "")
        : null;

      const { error } = await supabase.from("questions").insert({
        question_text: newQuestion.trim(),
        question_type: newQuestionType,
        options: options,
        points: newPoints,
        question_order: nextOrder,
      });

      if (error) throw error;

      toast.success("Question added!");
      setNewQuestion("");
      setNewPoints(10);
      setNewQuestionType("freeform");
      setNewOptions(["", "", "", ""]);
      fetchQuestions();
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Failed to add question");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleOpenRevealDialog = async (question: Question) => {
    setSelectedQuestion(question);
    setCorrectAnswer(question.correct_answer || "");
    setRevealDialogOpen(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("answers")
      .select("*, player:players(*)")
      .eq("question_id", question.id);

    if (data) {
      setQuestionAnswers(data as AnswerWithPlayer[]);
    }
  };

  const handleRevealAnswer = async () => {
    if (!selectedQuestion || !correctAnswer.trim()) return;

    setIsRevealing(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("questions")
        .update({
          correct_answer: correctAnswer.trim(),
          is_revealed: true,
        })
        .eq("id", selectedQuestion.id);

      if (error) {
        console.error("Error revealing answer:", error.message, error.details, error.hint);
        throw new Error(error.message || "Failed to reveal answer");
      }

      toast.success("Answer revealed and scores updated!");
      setRevealDialogOpen(false);
      setSelectedQuestion(null);
      setCorrectAnswer("");
      setQuestionAnswers([]);
      fetchQuestions();
    } catch (error) {
      console.error("Error revealing answer:", error instanceof Error ? error.message : JSON.stringify(error));
      toast.error(error instanceof Error ? error.message : "Failed to reveal answer");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleMarkCorrect = async (answerId: string, playerId: string, points: number) => {
    const supabase = createClient();

    try {
      await supabase
        .from("answers")
        .update({ is_correct: true, points_earned: points })
        .eq("id", answerId);

      const { data: playerData } = await supabase
        .from("players")
        .select("total_score")
        .eq("id", playerId)
        .single();

      if (playerData) {
        await supabase
          .from("players")
          .update({ total_score: playerData.total_score + points })
          .eq("id", playerId);
      }

      toast.success("Marked as correct!");

      const { data } = await supabase
        .from("answers")
        .select("*, player:players(*)")
        .eq("question_id", selectedQuestion?.id);

      if (data) {
        setQuestionAnswers(data as AnswerWithPlayer[]);
      }
    } catch (error) {
      console.error("Error marking correct:", error);
      toast.error("Failed to mark as correct");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      toast.success("Question deleted");
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    router.push("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#6c6c6c]">Loading...</div>
        </main>
      </div>
    );
  }

  const revealedCount = questions.filter(q => q.is_revealed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      <Header />

      {/* Stats Bar */}
      <div className="bg-[#252525]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-black text-xl">ADMIN DASHBOARD</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[#999] text-sm">
                  Game Code: <span className="text-white font-mono font-bold">{shareCode}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-[#999] text-[10px] uppercase tracking-wider font-semibold">Players</div>
                <div className="text-white font-black text-2xl">{playerCount}</div>
              </div>
              <div className="text-center">
                <div className="text-[#999] text-[10px] uppercase tracking-wider font-semibold">Revealed</div>
                <div className="text-white font-black text-2xl">{revealedCount}/{questions.length}</div>
              </div>
              <button
                onClick={() => setResetDialogOpen(true)}
                className="text-xs py-2 px-4 border border-red-400/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded font-semibold transition-colors"
              >
                Reset Game
              </button>
              <button
                onClick={handleLogout}
                className="espn-button-outline text-xs py-2 px-4 border-white/30 text-white/80 hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Add Question Form */}
            <div className="md:col-span-1">
              <div className="espn-card overflow-hidden">
                <div className="bg-[#252525] px-4 py-3">
                  <span className="text-white font-bold text-sm">ADD QUESTION</span>
                </div>
                <div className="p-4">
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2">
                        Question Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewQuestionType("freeform")}
                          className={`flex-1 py-2 px-3 text-sm font-semibold rounded transition-colors ${
                            newQuestionType === "freeform"
                              ? "bg-[#d00] text-white"
                              : "bg-[#f4f4f4] text-[#484848] hover:bg-[#e8e8e8]"
                          }`}
                        >
                          Free-form
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewQuestionType("multiple_choice")}
                          className={`flex-1 py-2 px-3 text-sm font-semibold rounded transition-colors ${
                            newQuestionType === "multiple_choice"
                              ? "bg-[#d00] text-white"
                              : "bg-[#f4f4f4] text-[#484848] hover:bg-[#e8e8e8]"
                          }`}
                        >
                          Multiple Choice
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2">
                        Question
                      </label>
                      <textarea
                        placeholder="Enter your trivia question..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="espn-input w-full min-h-[80px] resize-none"
                      />
                    </div>
                    {newQuestionType === "multiple_choice" && (
                      <div>
                        <label className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2">
                          Options (min 2)
                        </label>
                        <div className="space-y-2">
                          {newOptions.map((option, index) => (
                            <input
                              key={index}
                              type="text"
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => {
                                const updated = [...newOptions];
                                updated[index] = e.target.value;
                                setNewOptions(updated);
                              }}
                              className="espn-input w-full"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newPoints}
                        onChange={(e) => setNewPoints(parseInt(e.target.value) || 10)}
                        className="espn-input w-24"
                      />
                    </div>
                    <button
                      type="submit"
                      className="espn-button w-full"
                      disabled={!newQuestion.trim() || isAddingQuestion}
                    >
                      {isAddingQuestion ? "Adding..." : "Add Question"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="md:col-span-2 space-y-6">
              <div className="espn-card overflow-hidden">
                <div className="bg-[#252525] px-4 py-3">
                  <span className="text-white font-bold text-sm">QUESTIONS ({questions.length})</span>
                </div>
                {questions.length === 0 ? (
                  <div className="p-8 text-center text-[#6c6c6c]">
                    No questions yet. Add your first question!
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8e8]">
                    {questions.map((question, index) => (
                      <div key={question.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="espn-badge espn-badge-gray text-[10px]">Q{index + 1}</span>
                              <span className="espn-badge espn-badge-outline text-[10px]">{question.points} PTS</span>
                              <span className="espn-badge espn-badge-outline text-[10px]">
                                {question.question_type === "multiple_choice" ? "MC" : "FREE"}
                              </span>
                              {question.is_revealed ? (
                                <span className="espn-badge espn-badge-green text-[10px]">REVEALED</span>
                              ) : (
                                <span className="espn-badge espn-badge-outline text-[10px]">PENDING</span>
                              )}
                            </div>
                            <p className="text-[#121212] font-medium mb-2">
                              {question.question_text}
                            </p>
                            {question.question_type === "multiple_choice" && question.options && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {question.options.map((opt, i) => (
                                  <span key={i} className="text-xs bg-[#f4f4f4] px-2 py-1 rounded text-[#484848]">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                            {question.is_revealed && question.correct_answer && (
                              <div className="bg-[#e8f5e9] rounded px-3 py-2 inline-block">
                                <span className="text-[10px] font-bold text-[#2e7d32] uppercase tracking-wide">
                                  Answer:{" "}
                                </span>
                                <span className="text-[#1b5e20] font-semibold text-sm">
                                  {question.correct_answer}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!question.is_revealed && (
                              <button
                                onClick={() => handleOpenRevealDialog(question)}
                                className="espn-button text-xs py-2 px-3"
                              >
                                Set Answer
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-xs py-2 px-3 text-[#d00] hover:bg-[#ffebee] rounded font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Players List */}
              <div className="espn-card overflow-hidden">
                <div className="bg-[#252525] px-4 py-3">
                  <span className="text-white font-bold text-sm">PLAYERS ({playerCount})</span>
                </div>
                {players.length === 0 ? (
                  <div className="p-8 text-center text-[#6c6c6c]">
                    No players have joined yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8e8]">
                    {players.map((player) => (
                      <div key={player.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-600">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-[#121212]">{player.name}</div>
                            <div className="text-xs text-[#6c6c6c] font-mono">{player.join_code}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#121212]">{player.total_score} pts</div>
                          </div>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            className="text-xs py-2 px-3 text-[#d00] hover:bg-[#ffebee] rounded font-semibold transition-colors"
                          >
                            Delete
                          </button>
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

      {/* Reset Game Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600">Reset Game</DialogTitle>
            <DialogDescription className="text-[#484848]">
              This will delete all players and their answers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={resetQuestions}
                onChange={(e) => setResetQuestions(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#d00] focus:ring-[#d00]"
              />
              <span className="text-sm text-[#484848]">
                Also delete all questions (start completely fresh)
              </span>
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setResetDialogOpen(false)}
              className="espn-button-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleResetGame}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset Game"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal Answer Dialog */}
      <Dialog open={revealDialogOpen} onOpenChange={setRevealDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Reveal Answer</DialogTitle>
            <DialogDescription className="text-[#484848]">
              {selectedQuestion?.question_text}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div>
              <label className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2">
                Correct Answer
              </label>
              {selectedQuestion?.question_type === "multiple_choice" && selectedQuestion.options ? (
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCorrectAnswer(option)}
                      className={`w-full text-left px-4 py-3 rounded border-2 transition-colors ${
                        correctAnswer === option
                          ? "border-[#d00] bg-[#fff5f5] text-[#d00] font-semibold"
                          : "border-[#e8e8e8] hover:border-[#ccc] text-[#484848]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Enter the correct answer..."
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="espn-input w-full"
                />
              )}
            </div>

            {questionAnswers.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#6c6c6c] uppercase tracking-wide mb-2">
                  Player Answers ({questionAnswers.length})
                </label>
                <div className="space-y-2">
                  {questionAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="flex items-center justify-between p-3 bg-[#f4f4f4] rounded"
                    >
                      <div>
                        <span className="font-semibold text-[#121212]">{answer.player?.name}: </span>
                        <span className="text-[#484848]">{answer.answer_text}</span>
                      </div>
                      {answer.is_correct ? (
                        <span className="espn-badge espn-badge-green text-[10px]">CORRECT</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkCorrect(
                              answer.id,
                              answer.player_id,
                              selectedQuestion?.points || 10
                            )
                          }
                          className="text-xs py-1 px-2 text-[#d00] hover:bg-[#ffebee] rounded font-semibold transition-colors"
                        >
                          Mark Correct
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRevealDialogOpen(false)}
              className="espn-button-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevealAnswer}
              className="espn-button"
              disabled={!correctAnswer.trim() || isRevealing}
            >
              {isRevealing ? "Revealing..." : "Reveal Answer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
