// Simple in-memory store (will be replaced by database later)
export interface PrerequisiteCheck {
  label: string;
  checked: boolean;
  proofFileName?: string;
  proofFileData?: string; // base64
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
  origine: string; // "satisfaction_chaud" | "satisfaction_froid" | "reclamation" | "audit" | "autre"
  constat: string;
  action: string;
  responsable: string;
  echeance: string;
  statut: "a_faire" | "en_cours" | "fait";
  commentaire: string;
}

// Données réelles
const demoStudents: Student[] = [
  { id: "1775982623553", firstName: "Grégoire", lastName: "Derolez", email: "gregoire.derolez@gmail.com", phone: "0783244245", formation: "STS", startDate: "2026-03-16", endDate: "2026-03-18", status: "terminee" },
];

const demoAttendance: AttendanceSheet[] = [
  {
    id: "1775982701602", title: "STS", date: "2026-03-16", formation: "STS", status: "en_cours", days: 3,
    students: [
      { studentId: "1775982623553", studentName: "Grégoire Derolez", grade: "", livretVu: true, signatures: { J1: { signed: false }, J2: { signed: false }, J3: { signed: false } } },
    ],
  },
];

const demoDocuments: Document[] = [];

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
    id: "1775982849878", studentId: "1775982623553", studentName: "Grégoire Derolez", formation: "Télépilote Drone STS-01/STS-02",
    startDate: "2026-03-16", endDate: "2026-03-18", instructorName: "Stéphane PELARD",
    globalResult: "acquis",
    modules: [
      { id: "m1775982849877_0", name: "Connaître la réglementation européenne et française UAS", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 4, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_1", name: "Connaître les catégories d'exploitation (Ouverte, Spécifique, Certifiée)", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_2", name: "Créer et actualiser un MANEX", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 4, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_3", name: "Déclarer une activité d'exploitant UAS auprès des autorités", objectives: [], status: "acquis", ratingStart: 3, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_4", name: "Intégrer un UAS auprès d'un exploitant", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_5", name: "Préparer un vol Mission en STS-01", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_6", name: "Préparer un vol Mission en STS-02", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_7", name: "Lire et interpréter les cartes aéronautiques (OACI, NOTAM, SUP AIP)", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 4, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_8", name: "Effectuer les déclarations sur AlphaTango / DGAC", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849877_9", name: "Télépiloter un UAS avec assistance GPS", objectives: [], status: "acquis", ratingStart: 4, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_10", name: "Télépiloter un UAS en mode ATTI (sans GPS)", objectives: [], status: "acquis", ratingStart: 3, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_11", name: "Télépiloter un UAS en vol à vue (VLOS)", objectives: [], status: "acquis", ratingStart: 3, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_12", name: "Télépiloter un UAS hors vue (BVLOS) avec observateur", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_13", name: "Télépiloter un UAS en Situations dégradées", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_14", name: "Appliquer des procédures d'urgences adaptées à la mission et l'UAS", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_15", name: "Gérer les situations anormales (perte GPS, FlyAway, intrusion)", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_16", name: "Analyser des risques et déclarer un incident (CRESUS)", objectives: [], status: "acquis", ratingStart: 2, ratingEnd: 5, evaluatedAt: "12/04/2026" },
      { id: "m1775982849878_17", name: "Entretenir un UAS", objectives: [], status: "acquis", ratingStart: 3, ratingEnd: 5, evaluatedAt: "12/04/2026" },
    ],
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
    id: "1775983044054", studentId: "1775982623553", studentName: "Grégoire Derolez", formation: "STS", type: "chaud", date: "2026-04-12",
    comment: "Une formation riche en connaissances et en pratiques qui permet d'enrichir le savoir faire et savoir être dans ce domaine qui n'autorise pas les erreurs aussi bien de vol que dans dans la partie administrative. Un formateur avec une expérience et une écoute qui permet de s'adapter sur les besoins et les questions. 3 jours de formation en autonomie qui fait la différence sur le déroulé de formation et les scénarios de vols. je recommande. merci Stéphane",
    questions: [
      { id: "qc1775983044053_0", text: "Qualité du contenu pédagogique", rating: 5 },
      { id: "qc1775983044053_1", text: "Compétence du formateur", rating: 5 },
      { id: "qc1775983044053_2", text: "Clarté des explications", rating: 5 },
      { id: "qc1775983044053_3", text: "Adéquation de la formation avec vos attentes", rating: 5 },
      { id: "qc1775983044053_4", text: "Qualité du matériel utilisé", rating: 5 },
      { id: "qc1775983044053_5", text: "Organisation générale", rating: 5 },
    ],
  },
  {
    id: "1776005898051", studentId: "1775982623553", studentName: "Grégoire Derolez", formation: "STS", type: "froid", date: "2026-04-12",
    questions: [
      { id: "qf1776005898051_0", text: "J'utilise les compétences acquises dans mon activité professionnelle", rating: 0 },
      { id: "qf1776005898051_1", text: "Je me sens autonome dans l'utilisation du drone en conditions professionnelles", rating: 0 },
      { id: "qf1776005898051_2", text: "J'applique correctement la réglementation et les règles de sécurité", rating: 0 },
      { id: "qf1776005898051_3", text: "La formation a amélioré mon efficacité professionnelle", rating: 0 },
      { id: "qf1776005898051_4", text: "La formation a eu un impact professionnel positif", rating: 0 },
    ],
  },
];

// localStorage persistence helpers
const STORAGE_KEY = "drones37_store";
import { notifyStoreChange } from "@/hooks/useStoreData";

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage() {
  try {
    // Exclude large fileData from localStorage to avoid hitting the ~5MB limit
    const docsWithoutFiles = documents.map(d => ({ ...d, fileData: undefined }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, attendance, documents: docsWithoutFiles, progressions, satisfactions, invoiceStatuses, veilleEntries, planActionEntries }));
  } catch (e) {
    console.warn("⚠️ localStorage plein — utilisez l'export JSON pour sauvegarder vos données.");
  }
  notifyStoreChange();
}

const saved = loadFromStorage();

// Merge: ensure all hardcoded entries are always present, even if localStorage has old data
function mergeById<T extends { id: string }>(saved: T[] | undefined, defaults: T[]): T[] {
  const merged = [...(saved || [])];
  for (const def of defaults) {
    if (!merged.find(s => s.id === def.id)) {
      merged.push(def);
    }
  }
  return merged;
}

let students: Student[] = mergeById(saved?.students, demoStudents);
let attendance: AttendanceSheet[] = mergeById(saved?.attendance, demoAttendance);
let documents: Document[] = saved?.documents || [...demoDocuments];
let progressions: ProgressionSheet[] = mergeById(saved?.progressions, demoProgressions);
const rawSatisfactions: SatisfactionResponse[] = mergeById(saved?.satisfactions, demoSatisfactions);
let satisfactions: SatisfactionResponse[] = rawSatisfactions.filter((s) =>
  students.some((student) => student.id === s.studentId)
);
const demoInvoiceStatuses: Record<string, "paye" | "en_attente" | "impaye"> = { "1775982623553": "paye" };
const demoVeilleEntries: VeilleEntry[] = [
  { id: "1776005937992", date: "2026-04-03", type: "Réglementaire", contenu: "application météorologique", exploitation: "Test application", preuves: "Helico micro https://www.helicomicro.com/2026/04/03/skygo-drone/" },
  { id: "1776006372811", date: "2026-03-13", type: "Réglementaire", contenu: "Fiches reflexes", exploitation: "En attente de validation", preuves: "https://www.helicomicro.com/2026/03/13/fiches-reflexe-drones/" },
];
const demoPlanActionEntries: PlanActionEntry[] = [
  { id: "1776007569948", date: "2026-04-12", origine: "satisfaction_chaud", constat: "1 seul élève suite annulation", action: "Anticiper pour trouver un télépilote faissant office d'observateur pour le travail en binôme", responsable: "Stéphane PELARD", echeance: "2026-12-31", statut: "en_cours", commentaire: "" },
];
let invoiceStatuses: Record<string, "paye" | "en_attente" | "impaye"> = saved?.invoiceStatuses || { ...demoInvoiceStatuses };
let veilleEntries: VeilleEntry[] = mergeById(saved?.veilleEntries, demoVeilleEntries);
let planActionEntries: PlanActionEntry[] = mergeById(saved?.planActionEntries, demoPlanActionEntries);

export const store = {
  getStudents: () => students,
  addStudent: (s: Omit<Student, "id">) => {
    const newStudent = { ...s, id: Date.now().toString() };
    students = [...students, newStudent];
    saveToStorage();
    return newStudent;
  },
  deleteStudent: (id: string) => { students = students.filter(s => s.id !== id); saveToStorage(); },
  updateStudent: (id: string, updates: Partial<Student>) => {
    students = students.map(s => s.id === id ? { ...s, ...updates } : s);
    saveToStorage();
  },
  
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
  deleteAttendance: (id: string) => {
    attendance = attendance.filter(a => a.id !== id);
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
    saveToStorage();
    return newP;
  },
  updateModuleStatus: (progressionId: string, moduleId: string, status: ProgressionModule["status"], comment?: string) => {
    progressions = progressions.map(p => p.id === progressionId ? {
      ...p,
      modules: p.modules.map(m => m.id === moduleId ? {
        ...m, status, comment, evaluatedAt: new Date().toLocaleDateString("fr-FR"),
      } : m),
    } : p);
    saveToStorage();
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
    saveToStorage();
  },
  setGlobalResult: (progressionId: string, result: ProgressionSheet["globalResult"]) => {
    progressions = progressions.map(p => p.id === progressionId ? { ...p, globalResult: result } : p);
    saveToStorage();
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
    saveToStorage();
    return newS;
  },
  updateSatisfactionRating: (satisfactionId: string, questionId: string, rating: number) => {
    satisfactions = satisfactions.map(s => s.id === satisfactionId ? {
      ...s,
      questions: s.questions.map(q => q.id === questionId ? { ...q, rating } : q),
    } : s);
    saveToStorage();
  },
  updateSatisfactionComment: (satisfactionId: string, comment: string) => {
    satisfactions = satisfactions.map(s => s.id === satisfactionId ? { ...s, comment } : s);
    saveToStorage();
  },
  deleteSatisfaction: (satisfactionId: string) => {
    satisfactions = satisfactions.filter(s => s.id !== satisfactionId);
    saveToStorage();
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
    saveToStorage();
  },

  // Veille réglementaire
  getVeilleEntries: () => veilleEntries,
  addVeilleEntry: (entry: Omit<VeilleEntry, "id">) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    veilleEntries = [...veilleEntries, newEntry];
    saveToStorage();
    return newEntry;
  },
  updateVeilleEntry: (id: string, updates: Partial<VeilleEntry>) => {
    veilleEntries = veilleEntries.map(e => e.id === id ? { ...e, ...updates } : e);
    saveToStorage();
  },
  deleteVeilleEntry: (id: string) => {
    veilleEntries = veilleEntries.filter(e => e.id !== id);
    saveToStorage();
  },

  // Plan d'amélioration
  getPlanActionEntries: () => planActionEntries,
  addPlanActionEntry: (entry: Omit<PlanActionEntry, "id">) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    planActionEntries = [...planActionEntries, newEntry];
    saveToStorage();
    return newEntry;
  },
  updatePlanActionEntry: (id: string, updates: Partial<PlanActionEntry>) => {
    planActionEntries = planActionEntries.map(e => e.id === id ? { ...e, ...updates } : e);
    saveToStorage();
  },
  deletePlanActionEntry: (id: string) => {
    planActionEntries = planActionEntries.filter(e => e.id !== id);
    saveToStorage();
  },

  // Export / Import JSON
  exportData: () => {
    return JSON.stringify({ students, attendance, documents, progressions, satisfactions, invoiceStatuses, veilleEntries, planActionEntries }, null, 2);
  },
  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.students) students = data.students;
      if (data.attendance) attendance = data.attendance;
      if (data.documents) documents = data.documents;
      if (data.progressions) progressions = data.progressions;
      if (data.satisfactions) satisfactions = data.satisfactions;
      if (data.invoiceStatuses) invoiceStatuses = data.invoiceStatuses;
      if (data.veilleEntries) veilleEntries = data.veilleEntries;
      if (data.planActionEntries) planActionEntries = data.planActionEntries;
      saveToStorage();
      return true;
    } catch (e) {
      return false;
    }
  },
};
