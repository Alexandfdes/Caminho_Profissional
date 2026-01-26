-- Career Comparisons Table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS career_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    careers JSONB NOT NULL, -- Array of career comparison data
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE career_comparisons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own comparisons
CREATE POLICY "Users can view own comparisons"
    ON career_comparisons
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own comparisons
CREATE POLICY "Users can insert own comparisons"
    ON career_comparisons
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comparisons
CREATE POLICY "Users can delete own comparisons"
    ON career_comparisons
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_career_comparisons_user_id ON career_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_career_comparisons_created_at ON career_comparisons(created_at DESC);
