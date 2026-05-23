CREATE TABLE public.satisfaction_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  satisfaction_id TEXT NOT NULL REFERENCES public.satisfaction_responses(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  formation TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chaud', 'froid')),
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

ALTER TABLE public.satisfaction_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read satisfaction_tokens" ON public.satisfaction_tokens
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update satisfaction_tokens" ON public.satisfaction_tokens
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can insert satisfaction_tokens" ON public.satisfaction_tokens
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update satisfaction_questions via token" ON public.satisfaction_questions
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert satisfaction_questions via token" ON public.satisfaction_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update satisfaction_responses comment" ON public.satisfaction_responses
  FOR UPDATE USING (true);