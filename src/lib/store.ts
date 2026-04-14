// Supabase-backed store with in-memory cache
import { supabase } from "@/integrations/supabase/client";
import { notifyStoreChange } from "@/hooks/useStoreData";
import { getModulesForFormation } from "./formationModules";

export interface PrerequisiteCheck {
  label: string;
  checked: boolean;
  proofFileName?: string;
  proofFileData?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  formation: string;
  startDate: string;
  endDate: string;
  status: "en_cours" | "terminee" | "a_venir" | "abandonnee";
  dossierComplet?: boolean;
  handicap?: boolean;
  handicapDetails?: string;
  handicapAdaptations?: string;
  prerequisites?: PrerequisiteCheck[];
}

export interface AttendanceStudent {
  studentId: string;
  studentName: string;
  grade: string;
  livretVu: boolean;
  signatures: {
    [day: string]: {
      signed: boolean;
      signatureData?: string;
      signedAt?: string;
    };
  };
}

export interface AttendanceSheet {
  id: string;
  title: string;
  date: string;
  formation: string;
  days: number;
  students: AttendanceStudent[];
  status: "brouillon" | "en_cours" | "cloturee";
}

export interface ProgressionModule {
  id: string;
  name: string;
  objectives: string[];
  status: "non_evalue" | "en_cours" | "acquis" | "non_acquis";
  ratingStart?: number;
  ratingEnd?: number;
  comment?: string;
  evaluatedAt?: string;
}

export interface ProgressionSheet {
  id: string;
  studentId: string;
  studentName: string;
  formation: string;
  startDate: string;
  endDate: string;
  modules: ProgressionModule[];
  globalResult?: "acquis" | "en_cours" | "non_acquis";
  instructorName: string;
}

export interface SatisfactionQuestion {
  id: string;
  text: string;
  rating: number;
}

export interface SatisfactionResponse {
  id: string;
  studentId: string;
  studentName: string;
  formation: string;
  type: "chaud" | "froid";
  date: string;
  questions: SatisfactionQuestion[];
  comment?: string;
}

export interface Document {
  id: string;
  name: string;
  category: "convention" | "attestation" | "programme" | "facture" | "emargement" | "questionnaire" | "veille" | "plan_action" | "prerequis" | "procedure" | "autre";
  studentId?: string;
  formationId?: string;
  createdAt: string;
  size: string;
  fileData?: string;
}

export interface VeilleEntry {
  id: string;
  date: string;
  type: string;
  contenu: string;
  exploitation: string;
  preuves: string;
}

export interface PlanActionEntry {
  id: string;
  date: string;
  origine: string;
  constat: string;
  action: string;
  responsable: string;
  echeance: string;
  statut: "a_faire" | "en_cours" | "fait";
  commentaire: string;
}

function buildModulesForFormation(formation: string): Omit<ProgressionModule, "id">[] {
  return getModulesForFormation(formation).map(item => ({
    name: item.name,
    objectives: [],
    status: "non_evalue" as const,
  }));
}

const QUESTIONS_CHAUD: Omit<SatisfactionQuestion, "id">[] = [
  { text: "Qualité du contenu pédagogique", rating: 0 },
  { text: "Compétence du formateur", rating: 0 },
  { text: "Clarté des explications", rating: 0 },
  { text: "Adéquation de la formation avec vos attentes", rating: 0 },
  { text: "Qualité du matériel utilisé", rating: 0 },
  { text: "Organisation générale", rating: 0 },
];

const QUESTIONS_FROID: Omit<SatisfactionQuestion, "id">[] = [
  { text: "J'utilise les compétences acquises dans mon activité professionnelle", rating: 0 },
  { text: "Je me sens autonome dans l'utilisation du drone en conditions professionnelles", rating: 0 },
  { text: "J'applique correctement la réglementation et les règles de sécurité", rating: 0 },
  { text: "La formation a amélioré mon efficacité professionnelle", rating: 0 },
  { text: "La formation a eu un impact professionnel positif", rating: 0 },
];

// In-memory cache
let students: Student[] = [];
let attendance: AttendanceSheet[] = [];
let documents: Document[] = [];
let progressions: ProgressionSheet[] = [];
let satisfactions: SatisfactionResponse[] = [];
let invoiceStatuses: Record<string, "paye" | "en_attente" | "impaye"> = {};
let veilleEntries: VeilleEntry[] = [];
let planActionEntries: PlanActionEntry[] = [];
let _initialized = false;

// ── DB → App type converters ──
function dbToStudent(r: any): Student {
  return {
    id: r.id, firstName: r.first_name, lastName: r.last_name, email: r.email,
    phone: r.phone, formation: r.formation, startDate: r.start_date, endDate: r.end_date,
    status: r.status, dossierComplet: r.dossier_complet, handicap: r.handicap,
    handicapDetails: r.handicap_details, handicapAdaptations: r.handicap_adaptations,
    prerequisites: r.prerequisites || [],
  };
}

function dbToAttendanceSheet(sheet: any, attStudents: any[]): AttendanceSheet {
  return {
    id: sheet.id, title: sheet.title, date: sheet.date, formation: sheet.formation,
    days: sheet.days, status: sheet.status,
    students: attStudents.filter(s => s.sheet_id === sheet.id).map(s => ({
      studentId: s.student_id, studentName: s.student_name, grade: s.grade,
      livretVu: s.livret_vu, signatures: s.signatures || {},
    })),
  };
}

function dbToDocument(r: any): Document {
  return {
    id: r.id, name: r.name, category: r.category, studentId: r.student_id,
    formationId: r.formation_id, createdAt: r.created_at, size: r.size, fileData: r.file_data,
  };
}

function dbToProgression(sheet: any, modules: any[]): ProgressionSheet {
  return {
    id: sheet.id, studentId: sheet.student_id, studentName: sheet.student_name,
    formation: sheet.formation, startDate: sheet.start_date, endDate: sheet.end_date,
    instructorName: sheet.instructor_name, globalResult: sheet.global_result,
    modules: modules.filter(m => m.progression_id === sheet.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((m: any) => ({
        id: m.id, name: m.name, objectives: m.objectives || [],
        status: m.status, ratingStart: m.rating_start, ratingEnd: m.rating_end,
        comment: m.comment, evaluatedAt: m.evaluated_at,
      })),
  };
}

function dbToSatisfaction(resp: any, questions: any[]): SatisfactionResponse {
  return {
    id: resp.id, studentId: resp.student_id, studentName: resp.student_name,
    formation: resp.formation, type: resp.type, date: resp.date, comment: resp.comment,
    questions: questions.filter((q: any) => q.satisfaction_id === resp.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((q: any) => ({ id: q.id, text: q.text, rating: q.rating })),
  };
}

// ── Init: load everything from Supabase ──
export async function initStore() {
  if (_initialized) return;
  const [sRes, aRes, asRes, dRes, pRes, pmRes, srRes, sqRes, vRes, paRes, iRes] = await Promise.all([
    supabase.from("students").select("*"),
    supabase.from("attendance_sheets").select("*"),
    supabase.from("attendance_students").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("progression_sheets").select("*"),
    supabase.from("progression_modules").select("*"),
    supabase.from("satisfaction_responses").select("*"),
    supabase.from("satisfaction_questions").select("*"),
    supabase.from("veille_entries").select("*"),
    supabase.from("plan_action_entries").select("*"),
    supabase.from("invoice_statuses").select("*"),
  ]);

  students = (sRes.data || []).map(dbToStudent);
  const attStudents = asRes.data || [];
  attendance = (aRes.data || []).map((s: any) => dbToAttendanceSheet(s, attStudents));
  documents = (dRes.data || []).map(dbToDocument);
  const allModules = pmRes.data || [];
  progressions = (pRes.data || []).map((s: any) => dbToProgression(s, allModules));
  const allQuestions = sqRes.data || [];
  satisfactions = (srRes.data || []).map((s: any) => dbToSatisfaction(s, allQuestions));
  invoiceStatuses = {};
  (iRes.data || []).forEach((r: any) => { invoiceStatuses[r.student_id] = r.status; });
  veilleEntries = (vRes.data || []).map((r: any) => ({
    id: r.id, date: r.date, type: r.type, contenu: r.contenu,
    exploitation: r.exploitation, preuves: r.preuves,
  }));
  planActionEntries = (paRes.data || []).map((r: any) => ({
    id: r.id, date: r.date, origine: r.origine, constat: r.constat,
    action: r.action, responsable: r.responsable, echeance: r.echeance,
    statut: r.statut as PlanActionEntry["statut"], commentaire: r.commentaire,
  }));

  _initialized = true;
  notifyStoreChange();
}

export const store = {
  isInitialized: () => _initialized,

  // Students
  getStudents: () => students,
  addStudent: (s: Omit<Student, "id">) => {
    const newStudent = { ...s, id: Date.now().toString() };
    students = [...students, newStudent];
    notifyStoreChange();
    supabase.from("students").insert({
      id: newStudent.id, first_name: newStudent.firstName, last_name: newStudent.lastName,
      email: newStudent.email, phone: newStudent.phone, formation: newStudent.formation,
      start_date: newStudent.startDate, end_date: newStudent.endDate, status: newStudent.status,
      dossier_complet: newStudent.dossierComplet || false, handicap: newStudent.handicap || false,
      handicap_details: newStudent.handicapDetails, handicap_adaptations: newStudent.handicapAdaptations,
      prerequisites: (newStudent.prerequisites || []) as any,
    }).then();
    return newStudent;
  },
  deleteStudent: (id: string) => {
    students = students.filter(s => s.id !== id);
    notifyStoreChange();
    supabase.from("students").delete().eq("id", id).then();
  },
  updateStudent: (id: string, updates: Partial<Student>) => {
    students = students.map(s => s.id === id ? { ...s, ...updates } : s);
    notifyStoreChange();
    const db: any = {};
    if (updates.firstName !== undefined) db.first_name = updates.firstName;
    if (updates.lastName !== undefined) db.last_name = updates.lastName;
    if (updates.email !== undefined) db.email = updates.email;
    if (updates.phone !== undefined) db.phone = updates.phone;
    if (updates.formation !== undefined) db.formation = updates.formation;
    if (updates.startDate !== undefined) db.start_date = updates.startDate;
    if (updates.endDate !== undefined) db.end_date = updates.endDate;
    if (updates.status !== undefined) db.status = updates.status;
    if (updates.dossierComplet !== undefined) db.dossier_complet = updates.dossierComplet;
    if (updates.handicap !== undefined) db.handicap = updates.handicap;
    if (updates.handicapDetails !== undefined) db.handicap_details = updates.handicapDetails;
    if (updates.handicapAdaptations !== undefined) db.handicap_adaptations = updates.handicapAdaptations;
    if (updates.prerequisites !== undefined) db.prerequisites = updates.prerequisites as any;
    supabase.from("students").update(db).eq("id", id).then();
  },

  // Attendance
  getAttendance: () => attendance,
  addAttendance: (a: Omit<AttendanceSheet, "id">) => {
    const newSheet = { ...a, id: Date.now().toString() };
    attendance = [...attendance, newSheet];
    notifyStoreChange();
    supabase.from("attendance_sheets").insert({
      id: newSheet.id, title: newSheet.title, date: newSheet.date,
      formation: newSheet.formation, days: newSheet.days, status: newSheet.status,
    }).then(async () => {
      for (const s of newSheet.students) {
        await supabase.from("attendance_students").insert({
          sheet_id: newSheet.id, student_id: s.studentId, student_name: s.studentName,
          grade: s.grade, livret_vu: s.livretVu, signatures: s.signatures as any,
        });
      }
    });
    return newSheet;
  },
  signAttendance: (sheetId: string, studentId: string, day: string, signatureData: string) => {
    let updatedSigs: any = {};
    attendance = attendance.map(a => {
      if (a.id !== sheetId) return a;
      return {
        ...a,
        students: a.students.map(s => {
          if (s.studentId !== studentId) return s;
          const newSigs = { ...s.signatures, [day]: { signed: true, signatureData, signedAt: new Date().toLocaleString("fr-FR") } };
          updatedSigs = newSigs;
          return { ...s, signatures: newSigs };
        }),
      };
    });
    notifyStoreChange();
    supabase.from("attendance_students").update({ signatures: updatedSigs as any })
      .eq("sheet_id", sheetId).eq("student_id", studentId).then();
  },
  updateStudentGrade: (sheetId: string, studentId: string, grade: string) => {
    attendance = attendance.map(a => a.id === sheetId ? {
      ...a, students: a.students.map(s => s.studentId === studentId ? { ...s, grade } : s),
    } : a);
    notifyStoreChange();
    supabase.from("attendance_students").update({ grade })
      .eq("sheet_id", sheetId).eq("student_id", studentId).then();
  },
  toggleLivretVu: (sheetId: string, studentId: string) => {
    let newVal = false;
    attendance = attendance.map(a => a.id === sheetId ? {
      ...a, students: a.students.map(s => {
        if (s.studentId !== studentId) return s;
        newVal = !s.livretVu;
        return { ...s, livretVu: newVal };
      }),
    } : a);
    notifyStoreChange();
    supabase.from("attendance_students").update({ livret_vu: newVal })
      .eq("sheet_id", sheetId).eq("student_id", studentId).then();
  },
  closeAttendance: (id: string) => {
    attendance = attendance.map(a => a.id === id ? { ...a, status: "cloturee" as const } : a);
    notifyStoreChange();
    supabase.from("attendance_sheets").update({ status: "cloturee" }).eq("id", id).then();
  },
  deleteAttendance: (id: string) => {
    attendance = attendance.filter(a => a.id !== id);
    notifyStoreChange();
    supabase.from("attendance_sheets").delete().eq("id", id).then();
  },

  // Documents
  getDocuments: () => documents,
  addDocument: (d: Omit<Document, "id">) => {
    const newDoc = { ...d, id: Date.now().toString() };
    documents = [...documents, newDoc];
    notifyStoreChange();
    supabase.from("documents").insert({
      id: newDoc.id, name: newDoc.name, category: newDoc.category,
      student_id: newDoc.studentId, formation_id: newDoc.formationId,
      size: newDoc.size, file_data: newDoc.fileData,
    }).then();
    return newDoc;
  },
  deleteDocument: (id: string) => {
    documents = documents.filter(d => d.id !== id);
    notifyStoreChange();
    supabase.from("documents").delete().eq("id", id).then();
  },

  // Progressions
  getProgressions: () => progressions,
  getProgressionByStudent: (studentId: string) => progressions.find(p => p.studentId === studentId),
  addProgression: (p: Omit<ProgressionSheet, "id">) => {
    const newP = { ...p, id: Date.now().toString() };
    progressions = [...progressions, newP];
    notifyStoreChange();
    supabase.from("progression_sheets").insert({
      id: newP.id, student_id: newP.studentId, student_name: newP.studentName,
      formation: newP.formation, start_date: newP.startDate, end_date: newP.endDate,
      instructor_name: newP.instructorName, global_result: newP.globalResult,
    }).then(async () => {
      for (let i = 0; i < newP.modules.length; i++) {
        const m = newP.modules[i];
        await supabase.from("progression_modules").insert({
          id: m.id, progression_id: newP.id, name: m.name,
          objectives: (m.objectives || []) as any, status: m.status,
          rating_start: m.ratingStart, rating_end: m.ratingEnd,
          comment: m.comment, evaluated_at: m.evaluatedAt, sort_order: i,
        });
      }
    });
    return newP;
  },
  updateModuleStatus: (progressionId: string, moduleId: string, status: ProgressionModule["status"], comment?: string) => {
    const evaluatedAt = new Date().toLocaleDateString("fr-FR");
    progressions = progressions.map(p => p.id === progressionId ? {
      ...p, modules: p.modules.map(m => m.id === moduleId ? { ...m, status, comment, evaluatedAt } : m),
    } : p);
    notifyStoreChange();
    supabase.from("progression_modules").update({ status, comment, evaluated_at: evaluatedAt }).eq("id", moduleId).then();
  },
  updateModuleRating: (progressionId: string, moduleId: string, ratingStart?: number, ratingEnd?: number) => {
    progressions = progressions.map(p => p.id === progressionId ? {
      ...p, modules: p.modules.map(m => m.id === moduleId ? {
        ...m,
        ...(ratingStart !== undefined && { ratingStart }),
        ...(ratingEnd !== undefined && { ratingEnd }),
      } : m),
    } : p);
    notifyStoreChange();
    const upd: any = {};
    if (ratingStart !== undefined) upd.rating_start = ratingStart;
    if (ratingEnd !== undefined) upd.rating_end = ratingEnd;
    supabase.from("progression_modules").update(upd).eq("id", moduleId).then();
  },
  setGlobalResult: (progressionId: string, result: ProgressionSheet["globalResult"]) => {
    progressions = progressions.map(p => p.id === progressionId ? { ...p, globalResult: result } : p);
    notifyStoreChange();
    supabase.from("progression_sheets").update({ global_result: result }).eq("id", progressionId).then();
  },
  getDefaultModules: (formation?: string) => {
    const mods = formation ? buildModulesForFormation(formation) : buildModulesForFormation("Télépilote Drone STS-01/STS-02");
    return mods.map((m, i) => ({ ...m, id: `m${Date.now()}_${i}` }));
  },

  // Satisfaction
  getSatisfactions: () => satisfactions,
  getSatisfactionsByStudent: (studentId: string) => satisfactions.filter(s => s.studentId === studentId),
  addSatisfaction: (s: Omit<SatisfactionResponse, "id">) => {
    const newS = { ...s, id: Date.now().toString() };
    satisfactions = [...satisfactions, newS];
    notifyStoreChange();
    supabase.from("satisfaction_responses").insert({
      id: newS.id, student_id: newS.studentId, student_name: newS.studentName,
      formation: newS.formation, type: newS.type, date: newS.date, comment: newS.comment,
    }).then(async () => {
      for (let i = 0; i < newS.questions.length; i++) {
        const q = newS.questions[i];
        await supabase.from("satisfaction_questions").insert({
          id: q.id, satisfaction_id: newS.id, text: q.text, rating: q.rating, sort_order: i,
        });
      }
    });
    return newS;
  },
  updateSatisfactionRating: (satisfactionId: string, questionId: string, rating: number) => {
    satisfactions = satisfactions.map(s => s.id === satisfactionId ? {
      ...s, questions: s.questions.map(q => q.id === questionId ? { ...q, rating } : q),
    } : s);
    notifyStoreChange();
    supabase.from("satisfaction_questions").update({ rating }).eq("id", questionId).then();
  },
  updateSatisfactionComment: (satisfactionId: string, comment: string) => {
    satisfactions = satisfactions.map(s => s.id === satisfactionId ? { ...s, comment } : s);
    notifyStoreChange();
    supabase.from("satisfaction_responses").update({ comment }).eq("id", satisfactionId).then();
  },
  deleteSatisfaction: (satisfactionId: string) => {
    satisfactions = satisfactions.filter(s => s.id !== satisfactionId);
    notifyStoreChange();
    supabase.from("satisfaction_responses").delete().eq("id", satisfactionId).then();
  },
  getGlobalSatisfaction: (year?: number) => {
    const filtered = year ? satisfactions.filter(s => new Date(s.date).getFullYear() === year) : satisfactions;
    const allRatings = filtered.flatMap(s => s.questions.map(q => q.rating)).filter(r => r > 0);
    if (allRatings.length === 0) return 0;
    return Math.round((allRatings.reduce((a, b) => a + b, 0) / (allRatings.length * 5)) * 100);
  },
  getSatisfactionByType: (type: "chaud" | "froid", year?: number) => {
    let responses = satisfactions.filter(s => s.type === type);
    if (year) responses = responses.filter(s => new Date(s.date).getFullYear() === year);
    const allRatings = responses.flatMap(s => s.questions.map(q => q.rating)).filter(r => r > 0);
    if (allRatings.length === 0) return 0;
    return Math.round((allRatings.reduce((a, b) => a + b, 0) / (allRatings.length * 5)) * 100);
  },
  getSatisfactionCount: (year?: number) => {
    return year ? satisfactions.filter(s => new Date(s.date).getFullYear() === year).length : satisfactions.length;
  },
  getDefaultQuestions: (type: "chaud" | "froid") => {
    const qs = type === "chaud" ? QUESTIONS_CHAUD : QUESTIONS_FROID;
    return qs.map((q, i) => ({ ...q, id: `q${type[0]}${Date.now()}_${i}` }));
  },

  // Invoices
  getInvoices: () => invoiceStatuses,
  updateInvoiceStatus: (studentId: string, status: "paye" | "en_attente" | "impaye") => {
    invoiceStatuses = { ...invoiceStatuses, [studentId]: status };
    notifyStoreChange();
    supabase.from("invoice_statuses").upsert({ student_id: studentId, status }, { onConflict: "student_id" }).then();
  },

  // Veille réglementaire
  getVeilleEntries: () => veilleEntries,
  addVeilleEntry: (entry: Omit<VeilleEntry, "id">) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    veilleEntries = [...veilleEntries, newEntry];
    notifyStoreChange();
    supabase.from("veille_entries").insert({
      id: newEntry.id, date: newEntry.date, type: newEntry.type,
      contenu: newEntry.contenu, exploitation: newEntry.exploitation, preuves: newEntry.preuves,
    }).then();
    return newEntry;
  },
  updateVeilleEntry: (id: string, updates: Partial<VeilleEntry>) => {
    veilleEntries = veilleEntries.map(e => e.id === id ? { ...e, ...updates } : e);
    notifyStoreChange();
    supabase.from("veille_entries").update(updates).eq("id", id).then();
  },
  deleteVeilleEntry: (id: string) => {
    veilleEntries = veilleEntries.filter(e => e.id !== id);
    notifyStoreChange();
    supabase.from("veille_entries").delete().eq("id", id).then();
  },

  // Plan d'amélioration
  getPlanActionEntries: () => planActionEntries,
  addPlanActionEntry: (entry: Omit<PlanActionEntry, "id">) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    planActionEntries = [...planActionEntries, newEntry];
    notifyStoreChange();
    supabase.from("plan_action_entries").insert({
      id: newEntry.id, date: newEntry.date, origine: newEntry.origine,
      constat: newEntry.constat, action: newEntry.action, responsable: newEntry.responsable,
      echeance: newEntry.echeance, statut: newEntry.statut, commentaire: newEntry.commentaire,
    }).then();
    return newEntry;
  },
  updatePlanActionEntry: (id: string, updates: Partial<PlanActionEntry>) => {
    planActionEntries = planActionEntries.map(e => e.id === id ? { ...e, ...updates } : e);
    notifyStoreChange();
    supabase.from("plan_action_entries").update(updates).eq("id", id).then();
  },
  deletePlanActionEntry: (id: string) => {
    planActionEntries = planActionEntries.filter(e => e.id !== id);
    notifyStoreChange();
    supabase.from("plan_action_entries").delete().eq("id", id).then();
  },

  // Export / Import JSON
  exportData: () => {
    return JSON.stringify({ students, attendance, documents, progressions, satisfactions, invoiceStatuses, veilleEntries, planActionEntries }, null, 2);
  },
  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);

      if (data.students) {
        students = data.students;
        for (const s of data.students) {
          supabase.from("students").upsert({
            id: s.id,
            first_name: s.firstName,
            last_name: s.lastName,
            email: s.email,
            phone: s.phone,
            formation: s.formation,
            start_date: s.startDate,
            end_date: s.endDate,
            status: s.status,
            dossier_complet: s.dossierComplet || false,
            handicap: s.handicap || false,
            handicap_details: s.handicapDetails,
            handicap_adaptations: s.handicapAdaptations,
            prerequisites: (s.prerequisites || []) as any,
          }, { onConflict: "id" }).then();
        }
      }

      if (data.attendance) {
        attendance = data.attendance;
        for (const sheet of data.attendance) {
          supabase.from("attendance_sheets").upsert({
            id: sheet.id,
            title: sheet.title,
            date: sheet.date,
            formation: sheet.formation,
            days: sheet.days,
            status: sheet.status,
          }, { onConflict: "id" }).then(async () => {
            await supabase.from("attendance_students").delete().eq("sheet_id", sheet.id);
            for (const student of sheet.students || []) {
              await supabase.from("attendance_students").insert({
                sheet_id: sheet.id,
                student_id: student.studentId,
                student_name: student.studentName,
                grade: student.grade,
                livret_vu: student.livretVu,
                signatures: student.signatures as any,
              });
            }
          });
        }
      }

      if (data.documents) {
        documents = data.documents;
        for (const d of data.documents) {
          supabase.from("documents").upsert({
            id: d.id,
            name: d.name,
            category: d.category,
            student_id: d.studentId,
            formation_id: d.formationId,
            size: d.size,
            file_data: d.fileData,
          }, { onConflict: "id" }).then();
        }
      }

      if (data.progressions) {
        progressions = data.progressions;
        for (const p of data.progressions) {
          supabase.from("progression_sheets").upsert({
            id: p.id,
            student_id: p.studentId,
            student_name: p.studentName,
            formation: p.formation,
            start_date: p.startDate,
            end_date: p.endDate,
            instructor_name: p.instructorName,
            global_result: p.globalResult,
          }, { onConflict: "id" }).then(async () => {
            await supabase.from("progression_modules").delete().eq("progression_id", p.id);
            for (let i = 0; i < (p.modules || []).length; i++) {
              const m = p.modules[i];
              await supabase.from("progression_modules").insert({
                id: m.id,
                progression_id: p.id,
                name: m.name,
                objectives: (m.objectives || []) as any,
                status: m.status,
                rating_start: m.ratingStart,
                rating_end: m.ratingEnd,
                comment: m.comment,
                evaluated_at: m.evaluatedAt,
                sort_order: i,
              });
            }
          });
        }
      }

      if (data.satisfactions) {
        satisfactions = data.satisfactions;
        for (const s of data.satisfactions) {
          supabase.from("satisfaction_responses").upsert({
            id: s.id,
            student_id: s.studentId,
            student_name: s.studentName,
            formation: s.formation,
            type: s.type,
            date: s.date,
            comment: s.comment,
          }, { onConflict: "id" }).then(async () => {
            await supabase.from("satisfaction_questions").delete().eq("satisfaction_id", s.id);
            for (let i = 0; i < (s.questions || []).length; i++) {
              const q = s.questions[i];
              await supabase.from("satisfaction_questions").insert({
                id: q.id,
                satisfaction_id: s.id,
                text: q.text,
                rating: q.rating,
                sort_order: i,
              });
            }
          });
        }
      }

      if (data.veilleEntries) {
        veilleEntries = data.veilleEntries;
        for (const e of data.veilleEntries) {
          supabase.from("veille_entries").upsert({
            id: e.id,
            date: e.date,
            type: e.type,
            contenu: e.contenu,
            exploitation: e.exploitation,
            preuves: e.preuves,
          }, { onConflict: "id" }).then();
        }
      }

      if (data.planActionEntries) {
        planActionEntries = data.planActionEntries;
        for (const e of data.planActionEntries) {
          supabase.from("plan_action_entries").upsert({
            id: e.id,
            date: e.date,
            origine: e.origine,
            constat: e.constat,
            action: e.action,
            responsable: e.responsable,
            echeance: e.echeance,
            statut: e.statut,
            commentaire: e.commentaire,
          }, { onConflict: "id" }).then();
        }
      }

      if (data.invoiceStatuses) {
        invoiceStatuses = data.invoiceStatuses;
        for (const studentId of Object.keys(data.invoiceStatuses)) {
          const status = data.invoiceStatuses[studentId] as "paye" | "en_attente" | "impaye";
          supabase.from("invoice_statuses").upsert({
            student_id: studentId,
            status,
          }, { onConflict: "student_id" }).then();
        }
      }

      notifyStoreChange();
      return true;
    } catch (e) {
      return false;
    }
  },
};
