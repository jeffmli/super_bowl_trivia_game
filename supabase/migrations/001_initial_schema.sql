-- Super Bowl Trivia Game - Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    correct_answer TEXT, -- Nullable until revealed
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    is_revealed BOOLEAN DEFAULT false,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL, -- 4-char code for rejoin (e.g., "JEFF-A1B2")
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN, -- Nullable until revealed
    points_earned INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, question_id) -- One answer per player per question
);

-- Game settings table
CREATE TABLE IF NOT EXISTS game_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL
);

-- Insert default game settings
INSERT INTO game_settings (setting_key, setting_value) VALUES
    ('admin_password', 'superbowl2025'),
    ('share_code', 'BOWL25'),
    ('game_active', 'true'),
    ('allow_late_join', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answers_player_id ON answers(player_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(question_order);
CREATE INDEX IF NOT EXISTS idx_players_join_code ON players(join_code);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for questions table
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-score answers when a question is revealed
CREATE OR REPLACE FUNCTION score_answers_on_reveal()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run when is_revealed changes from false to true and correct_answer is set
    IF NEW.is_revealed = true AND OLD.is_revealed = false AND NEW.correct_answer IS NOT NULL THEN
        -- Score all answers for this question
        UPDATE answers
        SET
            is_correct = (LOWER(TRIM(answer_text)) = LOWER(TRIM(NEW.correct_answer))),
            points_earned = CASE
                WHEN LOWER(TRIM(answer_text)) = LOWER(TRIM(NEW.correct_answer))
                THEN NEW.points
                ELSE 0
            END
        WHERE question_id = NEW.id;

        -- Update total scores for all players
        UPDATE players
        SET total_score = (
            SELECT COALESCE(SUM(points_earned), 0)
            FROM answers
            WHERE answers.player_id = players.id
        );
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-scoring
DROP TRIGGER IF EXISTS trigger_score_answers ON questions;
CREATE TRIGGER trigger_score_answers
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION score_answers_on_reveal();

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions (public read, authenticated write)
CREATE POLICY "Questions are viewable by everyone" ON questions
    FOR SELECT USING (true);

CREATE POLICY "Questions can be inserted by anyone" ON questions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Questions can be updated by anyone" ON questions
    FOR UPDATE USING (true);

CREATE POLICY "Questions can be deleted by anyone" ON questions
    FOR DELETE USING (true);

-- RLS Policies for players
CREATE POLICY "Players are viewable by everyone" ON players
    FOR SELECT USING (true);

CREATE POLICY "Players can be created by anyone" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can be updated by anyone" ON players
    FOR UPDATE USING (true);

-- RLS Policies for answers
CREATE POLICY "Answers are viewable by everyone" ON answers
    FOR SELECT USING (true);

CREATE POLICY "Answers can be created by anyone" ON answers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Answers can be updated by anyone" ON answers
    FOR UPDATE USING (true);

-- RLS Policies for game_settings
CREATE POLICY "Game settings are viewable by everyone" ON game_settings
    FOR SELECT USING (true);

CREATE POLICY "Game settings can be updated by anyone" ON game_settings
    FOR UPDATE USING (true);

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
