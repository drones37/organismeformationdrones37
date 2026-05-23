-- 1. Add columns to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS attestation_result text,
  ADD COLUMN IF NOT EXISTS doc_signatures jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Allow anon to update doc_signatures (public signing page)
CREATE POLICY "Anon can update student doc_signatures"
ON public.students
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anon to read minimal student info needed by signing page
CREATE POLICY "Anon can read students"
ON public.students
FOR SELECT
TO anon
USING (true);

-- 3. Tokens for doc signing
CREATE TABLE IF NOT EXISTS public.doc_sign_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  student_id text NOT NULL,
  student_name text NOT NULL,
  doc_type text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.doc_sign_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read doc_sign_tokens"
ON public.doc_sign_tokens FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can update doc_sign_tokens"
ON public.doc_sign_tokens FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access doc_sign_tokens"
ON public.doc_sign_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);