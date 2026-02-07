-- Add question type and options columns to questions table
-- Run this in your Supabase SQL Editor

-- Add question_type column (default to 'freeform' for existing questions)
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'freeform';

-- Add options column for multiple choice questions (JSONB array)
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL;

-- Add constraint to ensure question_type is valid
ALTER TABLE questions
ADD CONSTRAINT valid_question_type
CHECK (question_type IN ('freeform', 'multiple_choice'));
