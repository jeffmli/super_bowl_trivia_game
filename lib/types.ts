export type QuestionType = 'freeform' | 'multiple_choice';

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  is_active: boolean;
  is_revealed: boolean;
  question_order: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  name: string;
  join_code: string;
  total_score: number;
  created_at: string;
}

export interface Answer {
  id: string;
  player_id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean | null;
  points_earned: number;
  submitted_at: string;
}

export interface GameSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

export interface QuestionWithAnswer extends Question {
  player_answer?: Answer | null;
}
