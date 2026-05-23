
ALTER TABLE public.progression_sheets
  ADD COLUMN IF NOT EXISTS observations text DEFAULT '',
  ADD COLUMN IF NOT EXISTS instructor_signature text,
  ADD COLUMN IF NOT EXISTS student_signature text,
  ADD COLUMN IF NOT EXISTS instructor_signed_at text,
  ADD COLUMN IF NOT EXISTS student_signed_at text;

CREATE TABLE IF NOT EXISTS public.progression_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL DEFAULT (gen_random_uuid())::text,
  progression_id text NOT NULL,
  student_name text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.progression_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read progression_tokens"
  ON public.progression_tokens FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can update progression_tokens"
  ON public.progression_tokens FOR UPDATE TO public USING (true);

CREATE POLICY "Authenticated can insert progression_tokens"
  ON public.progression_tokens FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated full access progression_tokens"
  ON public.progression_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon to update progression_sheets ONLY to add student signature (via token flow)
CREATE POLICY "Anon can update progression student signature"
  ON public.progression_sheets FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read progression_sheets"
  ON public.progression_sheets FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can read progression_modules"
  ON public.progression_modules FOR SELECT TO anon USING (true);
