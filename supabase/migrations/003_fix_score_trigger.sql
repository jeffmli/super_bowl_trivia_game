-- Fix score_answers_on_reveal trigger to work with pg_safeupdate
-- The previous trigger had UPDATE players without a WHERE clause,
-- which is blocked by Supabase's pg_safeupdate extension.

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

        -- Update total scores for players who have submitted answers
        UPDATE players
        SET total_score = (
            SELECT COALESCE(SUM(points_earned), 0)
            FROM answers
            WHERE answers.player_id = players.id
        )
        WHERE id IN (SELECT DISTINCT player_id FROM answers);
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';
