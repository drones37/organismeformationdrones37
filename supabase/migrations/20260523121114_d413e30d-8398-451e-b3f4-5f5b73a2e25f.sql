
CREATE TABLE public.qr_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),
  sheet_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  sheet_title TEXT NOT NULL,
  formation TEXT NOT NULL,
  day TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_tokens_token ON public.qr_tokens(token);
CREATE INDEX idx_qr_tokens_lookup ON public.qr_tokens(sheet_id, student_id, day);

ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated admins: full access
CREATE POLICY "Authenticated full access qr_tokens"
  ON public.qr_tokens FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Anonymous signers: read + update their token
CREATE POLICY "Anon can read qr_tokens"
  ON public.qr_tokens FOR SELECT
  TO anon USING (true);

CREATE POLICY "Anon can mark qr_tokens used"
  ON public.qr_tokens FOR UPDATE
  TO anon USING (used = false AND expires_at > now()) WITH CHECK (true);

-- Allow anonymous signers to update the signatures of the attendance_students row
CREATE POLICY "Anon can update attendance_students signatures"
  ON public.attendance_students FOR UPDATE
  TO anon USING (true) WITH CHECK (true);
