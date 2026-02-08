-- Add missing DELETE RLS policies for players and answers tables

CREATE POLICY "Players can be deleted by anyone" ON players
    FOR DELETE USING (true);

CREATE POLICY "Answers can be deleted by anyone" ON answers
    FOR DELETE USING (true);
