
-- Students table
CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  formation TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'a_venir' CHECK (status IN ('en_cours', 'terminee', 'a_venir', 'abandonnee')),
  dossier_complet BOOLEAN NOT NULL DEFAULT false,
  handicap BOOLEAN NOT NULL DEFAULT false,
  handicap_details TEXT,
  handicap_adaptations TEXT,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance sheets
CREATE TABLE public.attendance_sheets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  formation TEXT NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'en_cours', 'cloturee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on attendance_sheets" ON public.attendance_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance students (junction)
CREATE TABLE public.attendance_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id TEXT NOT NULL REFERENCES public.attendance_sheets(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT '',
  livret_vu BOOLEAN NOT NULL DEFAULT false,
  signatures JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on attendance_students" ON public.attendance_students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Documents
CREATE TABLE public.documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'autre',
  student_id TEXT,
  formation_id TEXT,
  size TEXT NOT NULL DEFAULT '0',
  file_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on documents" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Progression sheets
CREATE TABLE public.progression_sheets (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  formation TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  instructor_name TEXT NOT NULL DEFAULT '',
  global_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.progression_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on progression_sheets" ON public.progression_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Progression modules
CREATE TABLE public.progression_modules (
  id TEXT PRIMARY KEY,
  progression_id TEXT NOT NULL REFERENCES public.progression_sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'non_evalue',
  rating_start INTEGER,
  rating_end INTEGER,
  comment TEXT,
  evaluated_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.progression_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on progression_modules" ON public.progression_modules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Satisfaction responses
CREATE TABLE public.satisfaction_responses (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  formation TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chaud', 'froid')),
  date TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.satisfaction_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on satisfaction_responses" ON public.satisfaction_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Satisfaction questions
CREATE TABLE public.satisfaction_questions (
  id TEXT PRIMARY KEY,
  satisfaction_id TEXT NOT NULL REFERENCES public.satisfaction_responses(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.satisfaction_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on satisfaction_questions" ON public.satisfaction_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Veille entries
CREATE TABLE public.veille_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  contenu TEXT NOT NULL DEFAULT '',
  exploitation TEXT NOT NULL DEFAULT '',
  preuves TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.veille_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on veille_entries" ON public.veille_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Plan action entries
CREATE TABLE public.plan_action_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  origine TEXT NOT NULL DEFAULT '',
  constat TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  responsable TEXT NOT NULL DEFAULT '',
  echeance TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire', 'en_cours', 'fait')),
  commentaire TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_action_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on plan_action_entries" ON public.plan_action_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Invoice statuses
CREATE TABLE public.invoice_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('paye', 'en_attente', 'impaye')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access on invoice_statuses" ON public.invoice_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);
