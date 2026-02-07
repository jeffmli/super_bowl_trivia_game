"use client";

import { useState } from "react";
import { QuestionWithAnswer } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type QuestionStatus = "open" | "locked" | "revealed";

interface QuestionCardV2Props {
  question: QuestionWithAnswer;
  playerId: string;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit?: () => void;
}

export function QuestionCardV2({
  question,
  playerId,
  questionNumber,
  totalQuestions,
  onAnswerSubmit,
}: QuestionCardV2Props) {
  const [answer, setAnswer] = useState(question.player_answer?.answer_text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!question.player_answer);
  const hasAnswered = !!question.player_answer;
  const isRevealed = question.is_revealed;

  const status: QuestionStatus = isRevealed ? "revealed" : "open";

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
        { onConflict: "player_id,question_id" }
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

  const handleSelectOption = (option: string) => {
    setAnswer(option);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card Header - Meta info */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-sm font-semibold text-[#d00]">
            {question.points} {question.points === 1 ? "point" : "points"}
          </span>
        </div>
        {status === "revealed" ? (
          question.player_answer?.is_correct ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Correct! +{question.player_answer.points_earned}
            </span>
          ) : question.player_answer ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Incorrect
            </span>
          ) : (
            <span className="text-sm text-gray-500">No answer</span>
          )
        ) : hasAnswered && !isEditing ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Submitted
          </span>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Question Text */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed mb-6">
          {question.question_text}
        </h2>

        {/* Revealed State */}
        {isRevealed ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                Correct Answer
              </p>
              <p className="text-lg font-semibold text-green-800">
                {question.correct_answer}
              </p>
            </div>
            {question.player_answer && (
              <div
                className={`rounded-lg p-4 ${
                  question.player_answer.is_correct
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                    question.player_answer.is_correct ? "text-green-700" : "text-red-700"
                  }`}
                >
                  Your Answer
                </p>
                <p
                  className={`text-lg font-semibold ${
                    question.player_answer.is_correct ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {question.player_answer.answer_text}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Answer Form */
          <form onSubmit={handleSubmit}>
            {hasAnswered && !isEditing ? (
              /* Submitted State */
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Your Answer
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {question.player_answer?.answer_text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                >
                  Edit Answer
                </button>
              </div>
            ) : (
              /* Input State */
              <div className="space-y-4">
                {question.question_type === "multiple_choice" && question.options ? (
                  /* Multiple Choice Options */
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select your answer
                    </label>
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectOption(option)}
                        disabled={isSubmitting}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00] ${
                          answer === option
                            ? "border-[#d00] bg-red-50 text-[#d00] font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Free-form Input */
                  <div>
                    <label
                      htmlFor={`answer-${question.id}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Your Answer
                    </label>
                    <input
                      id={`answer-${question.id}`}
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#d00] focus:ring-1 focus:ring-[#d00] transition-colors"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Use full team name or abbreviation (e.g., Chiefs / KC)
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!answer.trim() || isSubmitting}
                    className="flex-1 py-3 px-4 bg-[#d00] text-white font-semibold rounded-lg hover:bg-[#b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d00]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : hasAnswered ? (
                      "Update Answer"
                    ) : (
                      "Submit Answer"
                    )}
                  </button>
                  {isEditing && hasAnswered && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setAnswer(question.player_answer?.answer_text || "");
                      }}
                      className="py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
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
