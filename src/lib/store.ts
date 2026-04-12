// Simple in-memory store (will be replaced by database later)
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  formation: string;
  startDate: string;
  endDate: string;
  status: "en_cours" | "terminee" | "a_venir";
}

export interface AttendanceStudent {
  studentId: string;
  studentName: string;
  grade: string; // Grade / Fonction
  livretVu: boolean;
  signatures: {
    [day: string]: { // "J1", "J2", "J3"
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
  days: number; // nombre de jours (1-5)
  students: AttendanceStudent[];
  status: "brouillon" | "en_cours" | "cloturee";
}

export interface ProgressionModule {
  id: string;
  name: string;
  objectives: string[];
  status: "non_evalue" | "en_cours" | "acquis" | "non_acquis";
  ratingStart?: number; // 1-5, évaluation début de formation
  ratingEnd?: number;   // 1-5, évaluation fin de formation
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
  rating: number; // 1-5
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
  category: "convention" | "attestation" | "programme" | "facture" | "emargement" | "questionnaire" | "autre";
  studentId?: string;
  formationId?: string;
  createdAt: string;
  size: string;
}

// Demo data
const demoStudents: Student[] = [
  { id: "1", firstName: "Lucas", lastName: "Martin", email: "lucas.martin@email.com", phone: "06 12 34 56 78", formation: "Télépilote Drone - Initiation", startDate: "2025-03-10", endDate: "2025-03-14", status: "terminee" },
  { id: "2", firstName: "Sophie", lastName: "Durand", email: "sophie.durand@email.com", phone: "06 23 45 67 89", formation: "Scénarios S1/S2/S3", startDate: "2025-04-01", endDate: "2025-04-05", status: "en_cours" },
  { id: "3", firstName: "Antoine", lastName: "Bernard", email: "antoine.b@email.com", phone: "06 34 56 78 90", formation: "Photogrammétrie Drone", startDate: "2025-04-15", endDate: "2025-04-18", status: "a_venir" },
  { id: "4", firstName: "Camille", lastName: "Petit", email: "camille.petit@email.com", phone: "06 45 67 89 01", formation: "Télépilote Drone - Initiation", startDate: "2025-03-10", endDate: "2025-03-14", status: "terminee" },
  { id: "5", firstName: "Maxime", lastName: "Robert", email: "maxime.r@email.com", phone: "06 56 78 90 12", formation: "Scénarios S1/S2/S3", startDate: "2025-04-01", endDate: "2025-04-05", status: "en_cours" },
];

const demoAttendance: AttendanceSheet[] = [
  {
    id: "1", title: "Émargement - Session Avril", date: "2025-04-01", formation: "Scénarios S1/S2/S3", status: "en_cours", days: 3,
    students: [
      { studentId: "2", studentName: "Sophie Durand", grade: "Technicienne", livretVu: true, signatures: { J1: { signed: true, signedAt: "2025-04-01 09:02" }, J2: { signed: false }, J3: { signed: false } } },
      { studentId: "5", studentName: "Maxime Robert", grade: "Ingénieur", livretVu: false, signatures: { J1: { signed: false }, J2: { signed: false }, J3: { signed: false } } },
    ],
  },
];

const demoDocuments: Document[] = [
  { id: "1", name: "Convention - Initiation Mars 2025.pdf", category: "convention", createdAt: "2025-02-15", size: "245 Ko" },
  { id: "2", name: "Programme Scénarios S1-S2-S3.pdf", category: "programme", createdAt: "2025-03-01", size: "1.2 Mo" },
  { id: "3", name: "Attestation Lucas Martin.pdf", category: "attestation", studentId: "1", createdAt: "2025-03-14", size: "180 Ko" },
  { id: "4", name: "Facture Formation Mars.pdf", category: "facture", createdAt: "2025-03-20", size: "95 Ko" },
];

import { getModulesForFormation } from "./formationModules";

function buildModulesForFormation(formation: string): Omit<ProgressionModule, "id">[] {
  return getModulesForFormation(formation).map(item => ({
    name: item.name,
    objectives: [],
    status: "non_evalue" as const,
  }));
}

const demoProgressions: ProgressionSheet[] = [
  {
    id: "1", studentId: "1", studentName: "Lucas Martin", formation: "Télépilote Drone STS-01/STS-02",
    startDate: "2025-03-10", endDate: "2025-03-14", instructorName: "Stéphane PELARD",
    globalResult: "acquis",
    modules: buildModulesForFormation("Télépilote Drone STS-01/STS-02").map((m, i) => ({ ...m, id: `m${i}`, status: "acquis" as const, ratingStart: 2, ratingEnd: 5, evaluatedAt: "2025-03-14" })),
  },
  {
    id: "2", studentId: "2", studentName: "Sophie Durand", formation: "Pulvérisation sur bâtiments par drone",
    startDate: "2025-04-01", endDate: "2025-04-05", instructorName: "Stéphane PELARD",
    modules: buildModulesForFormation("Pulvérisation sur bâtiments par drone").map((m, i) => ({ ...m, id: `m${i}`, status: i < 5 ? "acquis" as const : "en_cours" as const, ratingStart: 1 })),
  },
];

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

const demoSatisfactions: SatisfactionResponse[] = [
  {
    id: "sat1", studentId: "1", studentName: "Lucas Martin", formation: "Télépilote Drone - Initiation",
    type: "chaud", date: "2025-03-14",
    questions: QUESTIONS_CHAUD.map((q, i) => ({ ...q, id: `qc${i}`, rating: [5, 5, 4, 5, 4, 5][i] })),
    comment: "Excellente formation, très pratique !",
  },
  {
    id: "sat2", studentId: "4", studentName: "Camille Petit", formation: "Télépilote Drone - Initiation",
    type: "chaud", date: "2025-03-14",
    questions: QUESTIONS_CHAUD.map((q, i) => ({ ...q, id: `qc${i}`, rating: [4, 5, 5, 4, 4, 4][i] })),
  },
  {
    id: "sat3", studentId: "1", studentName: "Lucas Martin", formation: "Télépilote Drone - Initiation",
    type: "froid", date: "2025-04-14",
    questions: QUESTIONS_FROID.map((q, i) => ({ ...q, id: `qf${i}`, rating: [5, 4, 5, 4, 5][i] })),
    comment: "J'utilise les acquis quotidiennement.",
  },
];

// localStorage persistence helpers
const STORAGE_KEY = "drones37_store";

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, attendance, documents, progressions, satisfactions, invoiceStatuses }));
  } catch (e) { /* ignore */ }
}

const saved = loadFromStorage();
let students: Student[] = saved?.students || [...demoStudents];
let attendance: AttendanceSheet[] = saved?.attendance || [...demoAttendance];
let documents: Document[] = saved?.documents || [...demoDocuments];
let progressions: ProgressionSheet[] = saved?.progressions || [...demoProgressions];
let satisfactions: SatisfactionResponse[] = saved?.satisfactions || [...demoSatisfactions];
let invoiceStatuses: Record<string, "paye" | "en_attente" | "impaye"> = saved?.invoiceStatuses || {};

export const store = {
  getStudents: () => students,
  addStudent: (s: Omit<Student, "id">) => {
    const newStudent = { ...s, id: Date.now().toString() };
    students = [...students, newStudent];
    saveToStorage();
    return newStudent;
  },
  deleteStudent: (id: string) => { students = students.filter(s => s.id !== id); saveToStorage(); },
  
  getAttendance: () => attendance,
  addAttendance: (a: Omit<AttendanceSheet, "id">) => {
    const newSheet = { ...a, id: Date.now().toString() };
    attendance = [...attendance, newSheet];
    saveToStorage();
    return newSheet;
  },
  signAttendance: (sheetId: string, studentId: string, day: string, signatureData: string) => {
    attendance = attendance.map(a => a.id === sheetId ? {
      ...a,
      students: a.students.map(s => s.studentId === studentId ? {
        ...s,
        signatures: {
          ...s.signatures,
          [day]: { signed: true, signatureData, signedAt: new Date().toLocaleString("fr-FR") },
        },
      } : s),
    } : a);
    saveToStorage();
  },
  updateStudentGrade: (sheetId: string, studentId: string, grade: string) => {
    attendance = attendance.map(a => a.id === sheetId ? {
      ...a,
      students: a.students.map(s => s.studentId === studentId ? { ...s, grade } : s),
    } : a);
    saveToStorage();
  },
  toggleLivretVu: (sheetId: string, studentId: string) => {
    attendance = attendance.map(a => a.id === sheetId ? {
      ...a,
      students: a.students.map(s => s.studentId === studentId ? { ...s, livretVu: !s.livretVu } : s),
    } : a);
    saveToStorage();
  },
  closeAttendance: (id: string) => {
    attendance = attendance.map(a => a.id === id ? { ...a, status: "cloturee" as const } : a);
    saveToStorage();
  },

  getDocuments: () => documents,
  addDocument: (d: Omit<Document, "id">) => {
    const newDoc = { ...d, id: Date.now().toString() };
    documents = [...documents, newDoc];
    saveToStorage();
    return newDoc;
  },
  deleteDocument: (id: string) => { documents = documents.filter(d => d.id !== id); saveToStorage(); },

  getProgressions: () => progressions,
  getProgressionByStudent: (studentId: string) => progressions.find(p => p.studentId === studentId),
  addProgression: (p: Omit<ProgressionSheet, "id">) => {
    const newP = { ...p, id: Date.now().toString() };
    progressions = [...progressions, newP];
    return newP;
  },
  updateModuleStatus: (progressionId: string, moduleId: string, status: ProgressionModule["status"], comment?: string) => {
    progressions = progressions.map(p => p.id === progressionId ? {
      ...p,
      modules: p.modules.map(m => m.id === moduleId ? {
        ...m, status, comment, evaluatedAt: new Date().toLocaleDateString("fr-FR"),
      } : m),
    } : p);
  },
  updateModuleRating: (progressionId: string, moduleId: string, ratingStart?: number, ratingEnd?: number) => {
    progressions = progressions.map(p => p.id === progressionId ? {
      ...p,
      modules: p.modules.map(m => m.id === moduleId ? {
        ...m,
        ...(ratingStart !== undefined && { ratingStart }),
        ...(ratingEnd !== undefined && { ratingEnd }),
      } : m),
    } : p);
  },
  setGlobalResult: (progressionId: string, result: ProgressionSheet["globalResult"]) => {
    progressions = progressions.map(p => p.id === progressionId ? { ...p, globalResult: result } : p);
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
    return newS;
  },
  updateSatisfactionRating: (satisfactionId: string, questionId: string, rating: number) => {
    satisfactions = satisfactions.map(s => s.id === satisfactionId ? {
      ...s,
      questions: s.questions.map(q => q.id === questionId ? { ...q, rating } : q),
    } : s);
  },
  updateSatisfactionComment: (satisfactionId: string, comment: string) => {
    satisfactions = satisfactions.map(s => s.id === satisfactionId ? { ...s, comment } : s);
  },
  getGlobalSatisfaction: () => {
    const allRatings = satisfactions.flatMap(s => s.questions.map(q => q.rating)).filter(r => r > 0);
    if (allRatings.length === 0) return 0;
    return Math.round((allRatings.reduce((a, b) => a + b, 0) / (allRatings.length * 5)) * 100);
  },
  getSatisfactionByType: (type: "chaud" | "froid") => {
    const responses = satisfactions.filter(s => s.type === type);
    const allRatings = responses.flatMap(s => s.questions.map(q => q.rating)).filter(r => r > 0);
    if (allRatings.length === 0) return 0;
    return Math.round((allRatings.reduce((a, b) => a + b, 0) / (allRatings.length * 5)) * 100);
  },
  getDefaultQuestions: (type: "chaud" | "froid") => {
    const qs = type === "chaud" ? QUESTIONS_CHAUD : QUESTIONS_FROID;
    return qs.map((q, i) => ({ ...q, id: `q${type[0]}${Date.now()}_${i}` }));
  },

  // Invoices
  getInvoices: () => invoiceStatuses,
  updateInvoiceStatus: (studentId: string, status: "paye" | "en_attente" | "impaye") => {
    invoiceStatuses = { ...invoiceStatuses, [studentId]: status };
    saveToStorage();
  },
};
