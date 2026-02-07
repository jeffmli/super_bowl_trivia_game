"use client";

type QuestionStatus = "open" | "locked" | "revealed";

interface StatusStripProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  status: QuestionStatus;
}

export function StatusStrip({
  currentQuestion,
  totalQuestions,
  answeredCount,
  status,
}: StatusStripProps) {
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const getStatusConfig = (status: QuestionStatus) => {
    switch (status) {
      case "open":
        return {
          label: "Open",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          ),
        };
      case "locked":
        return {
          label: "Locked",
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
        };
      case "revealed":
        return {
          label: "Revealed",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Question Progress */}
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <div className="flex-1 max-w-[200px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d00] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>

          {/* Status Chip */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor}`}
          >
            <span className={statusConfig.textColor}>{statusConfig.icon}</span>
            <span className={`text-xs font-semibold ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
