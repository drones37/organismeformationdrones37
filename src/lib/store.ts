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

export interface AttendanceSheet {
  id: string;
  title: string;
  date: string;
  formation: string;
  students: {
    studentId: string;
    studentName: string;
    signed: boolean;
    signatureData?: string;
    signedAt?: string;
  }[];
  status: "brouillon" | "en_cours" | "cloturee";
}

export interface ProgressionModule {
  id: string;
  name: string;
  objectives: string[];
  status: "non_evalue" | "en_cours" | "acquis" | "non_acquis";
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
    id: "1", title: "Émargement - Jour 1", date: "2025-04-01", formation: "Scénarios S1/S2/S3", status: "en_cours",
    students: [
      { studentId: "2", studentName: "Sophie Durand", signed: true, signedAt: "2025-04-01 09:02" },
      { studentId: "5", studentName: "Maxime Robert", signed: false },
    ],
  },
];

const demoDocuments: Document[] = [
  { id: "1", name: "Convention - Initiation Mars 2025.pdf", category: "convention", createdAt: "2025-02-15", size: "245 Ko" },
  { id: "2", name: "Programme Scénarios S1-S2-S3.pdf", category: "programme", createdAt: "2025-03-01", size: "1.2 Mo" },
  { id: "3", name: "Attestation Lucas Martin.pdf", category: "attestation", studentId: "1", createdAt: "2025-03-14", size: "180 Ko" },
  { id: "4", name: "Facture Formation Mars.pdf", category: "facture", createdAt: "2025-03-20", size: "95 Ko" },
];

const defaultModules: Omit<ProgressionModule, "id">[] = [
  { name: "Réglementation aérienne", objectives: ["Connaître la réglementation DGAC", "Maîtriser les scénarios STS-01", "Comprendre les restrictions de vol"], status: "non_evalue" },
  { name: "Préparation de mission", objectives: ["Analyser les besoins de la mission", "Choisir l'aéronef adapté", "Préparer le dossier de vol"], status: "non_evalue" },
  { name: "Pilotage en vol", objectives: ["Décoller et atterrir en sécurité", "Maîtriser les trajectoires", "Gérer les situations d'urgence"], status: "non_evalue" },
  { name: "Techniques de pulvérisation", objectives: ["Choisir les produits adaptés", "Régler le matériel de pulvérisation", "Appliquer les techniques sur bâtiments"], status: "non_evalue" },
  { name: "Sécurité et procédures", objectives: ["Appliquer les procédures de sécurité", "Gérer les risques", "Respecter les zones d'exclusion"], status: "non_evalue" },
];

const demoProgressions: ProgressionSheet[] = [
  {
    id: "1", studentId: "1", studentName: "Lucas Martin", formation: "Télépilote Drone - Initiation",
    startDate: "2025-03-10", endDate: "2025-03-14", instructorName: "Stéphane PELARD",
    globalResult: "acquis",
    modules: defaultModules.map((m, i) => ({ ...m, id: `m${i}`, status: "acquis" as const, evaluatedAt: "2025-03-14" })),
  },
  {
    id: "2", studentId: "2", studentName: "Sophie Durand", formation: "Scénarios S1/S2/S3",
    startDate: "2025-04-01", endDate: "2025-04-05", instructorName: "Stéphane PELARD",
    modules: defaultModules.map((m, i) => ({ ...m, id: `m${i}`, status: i < 2 ? "acquis" as const : "en_cours" as const })),
  },
];

let students = [...demoStudents];
let attendance = [...demoAttendance];
let documents = [...demoDocuments];
let progressions = [...demoProgressions];

export const store = {
  getStudents: () => students,
  addStudent: (s: Omit<Student, "id">) => {
    const newStudent = { ...s, id: Date.now().toString() };
    students = [...students, newStudent];
    return newStudent;
  },
  deleteStudent: (id: string) => { students = students.filter(s => s.id !== id); },
  
  getAttendance: () => attendance,
  addAttendance: (a: Omit<AttendanceSheet, "id">) => {
    const newSheet = { ...a, id: Date.now().toString() };
    attendance = [...attendance, newSheet];
    return newSheet;
  },
  signAttendance: (sheetId: string, studentId: string, signatureData: string) => {
    attendance = attendance.map(a => a.id === sheetId ? {
      ...a,
      students: a.students.map(s => s.studentId === studentId ? {
        ...s, signed: true, signatureData, signedAt: new Date().toLocaleString("fr-FR"),
      } : s),
    } : a);
  },
  closeAttendance: (id: string) => {
    attendance = attendance.map(a => a.id === id ? { ...a, status: "cloturee" as const } : a);
  },

  getDocuments: () => documents,
  addDocument: (d: Omit<Document, "id">) => {
    const newDoc = { ...d, id: Date.now().toString() };
    documents = [...documents, newDoc];
    return newDoc;
  },
  deleteDocument: (id: string) => { documents = documents.filter(d => d.id !== id); },

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
  setGlobalResult: (progressionId: string, result: ProgressionSheet["globalResult"]) => {
    progressions = progressions.map(p => p.id === progressionId ? { ...p, globalResult: result } : p);
  },
  getDefaultModules: () => defaultModules.map((m, i) => ({ ...m, id: `m${Date.now()}_${i}` })),
};
