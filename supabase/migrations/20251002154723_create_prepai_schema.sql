/*
  # PrepAI Database Schema

  ## Overview
  Complete database schema for PrepAI - Smart AI-Powered Interview Coach platform

  ## New Tables
  
  ### 1. profiles
  - Extends auth.users with additional user information
  - `id` (uuid, references auth.users)
  - `full_name` (text)
  - `avatar_url` (text)
  - `role` (text) - 'candidate' or 'admin'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. interview_sessions
  - Stores AI mock interview sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `job_role` (text)
  - `difficulty` (text)
  - `status` (text) - 'in_progress', 'completed', 'abandoned'
  - `score` (integer)
  - `feedback` (jsonb)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### 3. interview_questions
  - Stores questions asked during interviews
  - `id` (uuid, primary key)
  - `session_id` (uuid, references interview_sessions)
  - `question_text` (text)
  - `answer_text` (text)
  - `ai_feedback` (text)
  - `score` (integer)
  - `created_at` (timestamptz)

  ### 4. resumes
  - Stores uploaded resumes and analysis
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `file_url` (text)
  - `file_name` (text)
  - `job_role` (text)
  - `analysis_result` (jsonb)
  - `score` (integer)
  - `created_at` (timestamptz)

  ### 5. user_achievements
  - Tracks gamification badges and milestones
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `achievement_type` (text)
  - `achievement_name` (text)
  - `description` (text)
  - `icon` (text)
  - `earned_at` (timestamptz)

  ### 6. learning_resources
  - Curated learning materials
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `category` (text)
  - `content_url` (text)
  - `thumbnail_url` (text)
  - `created_at` (timestamptz)

  ### 7. user_progress
  - Tracks user learning progress
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `total_interviews` (integer)
  - `average_score` (numeric)
  - `interviews_this_week` (integer)
  - `total_points` (integer)
  - `total_resumes_analyzed` (integer)
  - `streak_days` (integer)
  - `last_activity` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to manage their own data
  - Admin-only policies for learning resources and platform management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_role text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  score integer DEFAULT 0,
  feedback jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview sessions"
  ON interview_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions"
  ON interview_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions"
  ON interview_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  answer_text text DEFAULT '',
  ai_feedback text DEFAULT '',
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview questions"
  ON interview_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own interview questions"
  ON interview_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own interview questions"
  ON interview_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  job_role text DEFAULT '',
  analysis_result jsonb DEFAULT '{}',
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  earned_at timestamptz DEFAULT now()
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create learning_resources table
CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  content_url text NOT NULL,
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view learning resources"
  ON learning_resources FOR SELECT
  TO authenticated
  USING (true);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_interviews integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  interviews_this_week integer DEFAULT 0,
  total_points integer DEFAULT 0,
  total_resumes_analyzed integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session_id ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Insert sample learning resources
INSERT INTO learning_resources (title, description, category, content_url, thumbnail_url)
VALUES
  ('STAR Method Mastery', 'Learn how to structure perfect behavioral interview answers', 'Behavioral', '#', ''),
  ('System Design Fundamentals', 'Master the basics of system design interviews', 'Technical', '#', ''),
  ('Common HR Questions', 'Top 50 HR questions with winning answers', 'HR', '#', ''),
  ('Coding Interview Patterns', 'Essential data structures and algorithms', 'Technical', '#', ''),
  ('Body Language Tips', 'Non-verbal communication in interviews', 'Soft Skills', '#', ''),
  ('Salary Negotiation Guide', 'How to negotiate your worth confidently', 'Career', '#', '')
ON CONFLICT DO NOTHING;
