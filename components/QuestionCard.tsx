"use client";

import { useState } from "react";
import { QuestionWithAnswer } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface QuestionCardProps {
  question: QuestionWithAnswer;
  playerId: string;
  questionNumber: number;
  onAnswerSubmit?: () => void;
}

export function QuestionCard({
  question,
  playerId,
  questionNumber,
  onAnswerSubmit,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState(question.player_answer?.answer_text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const hasAnswered = !!question.player_answer;
  const isRevealed = question.is_revealed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isRevealed) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from("answers").upsert(
        {
          player_id: playerId,
          question_id: question.id,
          answer_text: answer.trim(),
        },
        {
          onConflict: "player_id,question_id",
        }
      );

      if (error) throw error;

      toast.success(hasAnswered ? "Answer updated!" : "Answer submitted!");
      setIsEditing(false);
      onAnswerSubmit?.();
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="espn-card overflow-hidden">
      {/* Question Header */}
      <div className="bg-[#252525] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">Q{questionNumber}</span>
          <span className="espn-badge espn-badge-gray">{question.points} PTS</span>
        </div>
        {isRevealed ? (
          question.player_answer?.is_correct ? (
            <span className="espn-badge espn-badge-green">CORRECT</span>
          ) : question.player_answer ? (
            <span className="espn-badge espn-badge-red">INCORRECT</span>
          ) : (
            <span className="espn-badge espn-badge-outline">NO ANSWER</span>
          )
        ) : hasAnswered ? (
          <span className="espn-badge espn-badge-gray">ANSWERED</span>
        ) : (
          <span className="espn-badge espn-badge-outline">PENDING</span>
        )}
      </div>

      {/* Question Content */}
      <div className="p-4">
        <p className="text-[#121212] font-semibold text-base leading-relaxed mb-4">
          {question.question_text}
        </p>

        {isRevealed ? (
          <div className="space-y-3">
            {/* Correct Answer */}
            <div className="bg-[#e8f5e9] border border-[#a5d6a7] rounded p-3">
              <div className="text-[11px] font-bold text-[#2e7d32] uppercase tracking-wide mb-1">
                Correct Answer
              </div>
              <div className="text-[#1b5e20] font-semibold">
                {question.correct_answer}
              </div>
            </div>

            {/* Player's Answer */}
            {question.player_answer && (
              <div
                className={`rounded p-3 ${
                  question.player_answer.is_correct
                    ? "bg-[#e8f5e9] border border-[#a5d6a7]"
                    : "bg-[#ffebee] border border-[#ef9a9a]"
                }`}
              >
                <div
                  className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${
                    question.player_answer.is_correct
                      ? "text-[#2e7d32]"
                      : "text-[#c62828]"
                  }`}
                >
                  Your Answer {question.player_answer.is_correct && `(+${question.player_answer.points_earned} pts)`}
                </div>
                <div
                  className={`font-semibold ${
                    question.player_answer.is_correct
                      ? "text-[#1b5e20]"
                      : "text-[#b71c1c]"
                  }`}
                >
                  {question.player_answer.answer_text}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {hasAnswered && !isEditing ? (
              <div className="bg-[#f4f4f4] rounded p-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#6c6c6c] uppercase tracking-wide mb-1">
                    Your Answer
                  </div>
                  <div className="text-[#121212] font-semibold">
                    {question.player_answer?.answer_text}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="espn-button-outline text-xs py-2 px-3"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {question.question_type === "multiple_choice" && question.options ? (
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAnswer(option)}
                        disabled={isSubmitting}
                        className={`w-full text-left px-4 py-3 rounded border-2 transition-colors ${
                          answer === option
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
                    placeholder="Type your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="espn-input w-full"
                    disabled={isSubmitting}
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="espn-button flex-1"
                    disabled={!answer.trim() || isSubmitting}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : hasAnswered
                      ? "Update Answer"
                      : "Submit Answer"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setAnswer(question.player_answer?.answer_text || "");
                      }}
                      className="espn-button-outline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
