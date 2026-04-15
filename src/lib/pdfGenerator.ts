import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttendanceSheet, ProgressionSheet, Student, SatisfactionResponse } from "./store";
import { getModulesForFormation } from "./formationModules";

const COMPANY = {
  name: "DRONES37",
  owner: "PELARD Stéphane",
  address: "19 rue Madeleine Vernet, 37270 Montlouis sur Loire",
  phone: "06 51 11 27 02",
  email: "contact@drones37.com",
  siret: "497 986 604 00021",
  nda: "24370471537",
};

const COLORS = {
  primary: [42, 42, 42] as [number, number, number],
  accent: [229, 165, 0] as [number, number, number],     // golden yellow from logo
  text: [44, 44, 44] as [number, number, number],
  lightGray: [245, 243, 238] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [39, 174, 96] as [number, number, number],
  warning: [243, 156, 18] as [number, number, number],
  danger: [231, 76, 60] as [number, number, number],
};

// Formation-specific content for documents
interface FormationDocConfig {
  objectives: string[];
  materiel: string;
  dureeLabel: string;
  prerequis: string;
}

function getFormationDocConfig(formation: string): FormationDocConfig {
  const lower = formation.toLowerCase();
  if (lower.includes("pulvé") || lower.includes("bâtiment")) {
    return {
      objectives: [
        "Connaître et appliquer la réglementation en vigueur concernant l'usage professionnel de drone civil",
        "Maîtriser le télépilotage d'un drone dans le cadre de missions de pulvérisation sur bâtiments",
        "Connaître les produits de traitement et leurs utilisations",
        "Maîtriser les équipements de protection individuelle et le matériel de pulvérisation",
        "Réaliser des missions de pulvérisation par drone en conformité avec le cadre réglementaire",
      ],
      materiel: "Matériel pour écrire, tenue de travail adaptée au chantier, équipement de protection individuelle (EPI), matériel informatique.",
      dureeLabel: "5 jours (35 heures)",
      prerequis: "Être titulaire du CATT (Certificat d'Aptitude au Télépilotage Théorique) ou équivalent.",
    };
  }
  if (lower.includes("a1") || lower.includes("a3") || lower.includes("ouverte")) {
    return {
      objectives: [
        "Connaître la réglementation européenne applicable à la catégorie ouverte (A1, A2, A3)",
        "Connaître les classes d'UAS et les limitations de masse et de vitesse",
        "Préparer et effectuer un vol en catégorie ouverte en toute sécurité",
        "Gérer les situations d'urgence et appliquer les règles de sécurité",
        "Obtenir le BAPD (Brevet d'Aptitude de Pilote à Distance) A1/A3 via AlphaTango",
      ],
      materiel: "Matériel pour écrire, tenue décontractée, matériel informatique avec accès internet.",
      dureeLabel: "2 jours (14 heures)",
      prerequis: "Aucun prérequis spécifique.",
    };
  }
  // Default: STS-01/STS-02
  return {
    objectives: [
      "Connaître et appliquer la réglementation européenne et française concernant l'usage professionnel de drone civil",
      "Maîtriser le télépilotage d'un drone civil dans le cadre des scénarios STS-01 et STS-02",
      "Assurer le suivi administratif indissociable de l'activité (MANEX, AlphaTango, DGAC)",
      "Maîtriser la préparation du vol mission et la lecture des cartes aéronautiques",
      "Gérer les situations dégradées et appliquer les procédures d'urgence",
    ],
    materiel: "Matériel pour écrire, tenue décontractée, équipement météo, matériel informatique avec carte SD.",
    dureeLabel: "5 jours (35 heures)",
    prerequis: "Être titulaire du CATT (Certificat d'Aptitude au Télépilotage Théorique) ou équivalent.",
  };
}
function addHeader(doc: jsPDF) {
  // Header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 32, "F");

  // Company name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("DRONES37", 15, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ORGANISME DE FORMATION", 15, 25);

  // Company info right
  doc.setFontSize(7);
  doc.text(`${COMPANY.address}`, 195, 12, { align: "right" });
  doc.text(`Tél: ${COMPANY.phone} | ${COMPANY.email}`, 195, 17, { align: "right" });
  doc.text(`SIRET: ${COMPANY.siret} | NDA: ${COMPANY.nda}`, 195, 22, { align: "right" });

  // Accent line
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 32, 210, 2, "F");

  doc.setTextColor(...COLORS.text);
}

function addFooter(doc: jsPDF, pageNum?: number, totalPages?: number) {
  const h = doc.internal.pageSize.height;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, h - 15, 210, 15, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.text(`EI DRONES37 — SIRET ${COMPANY.siret} — NDA ${COMPANY.nda}`, 105, h - 8, { align: "center" });
  if (pageNum && totalPages) {
    doc.text(`Page ${pageNum}/${totalPages}`, 195, h - 8, { align: "right" });
  }
  doc.setTextColor(...COLORS.text);
}

// ===================== FEUILLE D'ÉMARGEMENT =====================

export function generateAttendancePDF(sheet: AttendanceSheet) {
  const doc = new jsPDF({ orientation: "landscape" });
  addHeaderLandscape(doc);

  let y = 38;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FEUILLE D'ÉMARGEMENT", 148.5, y, { align: "center" });
  y += 8;

  // Info block
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 267, 22, 3, 3, "F");
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Session :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(sheet.title, 48, y);
  doc.setFont("helvetica", "bold");
  doc.text("Formation :", 140, y);
  doc.setFont("helvetica", "normal");
  doc.text(sheet.formation, 172, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Date :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(sheet.date).toLocaleDateString("fr-FR"), 40, y);
  doc.setFont("helvetica", "bold");
  doc.text("Lieu :", 140, y);
  doc.setFont("helvetica", "normal");
  doc.text("Montlouis sur Loire", 155, y);
  doc.setFont("helvetica", "bold");
  doc.text("Formateur :", 210, y);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.owner, 240, y);
  y += 12;

  // Build day columns
  const dayLabels = Array.from({ length: sheet.days }, (_, i) => `J${i + 1}`);

  // Table headers
  const head = [["N°", "Nom Prénom", "Grade / Fonction", "Livret vu", ...dayLabels]];

  const tableData = sheet.students.map((s, i) => {
    const dayCells = dayLabels.map(day => {
      const sig = s.signatures[day];
      return sig?.signed ? "✓" : "";
    });
    return [
      (i + 1).toString(),
      s.studentName,
      s.grade || "",
      s.livretVu ? "✓" : "",
      ...dayCells,
    ];
  });

  const dayColWidth = Math.min(35, 120 / sheet.days);

  const colStyles: Record<number, any> = {
    0: { halign: "center", cellWidth: 12 },
    1: { cellWidth: 50 },
    2: { cellWidth: 45 },
    3: { halign: "center", cellWidth: 22 },
  };
  dayLabels.forEach((_, i) => {
    colStyles[4 + i] = { halign: "center", cellWidth: dayColWidth };
  });

  autoTable(doc, {
    startY: y,
    head,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4,
      minCellHeight: 16,
    },
    columnStyles: colStyles,
    margin: { left: 15, right: 15 },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    didDrawCell: (data: any) => {
      // Draw signature images in day columns
      if (data.section === "body" && data.column.index >= 4) {
        const studentIdx = data.row.index;
        const dayIdx = data.column.index - 4;
        const student = sheet.students[studentIdx];
        const day = dayLabels[dayIdx];
        const sig = student?.signatures[day];
        if (sig?.signed && sig?.signatureData) {
          try {
            doc.addImage(sig.signatureData, "PNG", data.cell.x + 2, data.cell.y + 1, dayColWidth - 4, data.cell.height - 2);
          } catch { /* skip */ }
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  let sigY = finalY + 10;

  // Instructor signature
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Signature du formateur :", 20, sigY);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.owner, 75, sigY);
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(140, sigY - 5, 60, 20);

  addFooterLandscape(doc);

  doc.save(`Emargement_${sheet.title.replace(/\s+/g, "_")}.pdf`);
}

function addHeaderLandscape(doc: jsPDF) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 297, 28, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DRONES37", 15, 15);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("ORGANISME DE FORMATION", 15, 21);
  doc.text(`${COMPANY.address}`, 282, 10, { align: "right" });
  doc.text(`Tél: ${COMPANY.phone} | ${COMPANY.email}`, 282, 15, { align: "right" });
  doc.text(`SIRET: ${COMPANY.siret} | NDA: ${COMPANY.nda}`, 282, 20, { align: "right" });
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 28, 297, 2, "F");
  doc.setTextColor(...COLORS.text);
}

function addFooterLandscape(doc: jsPDF) {
  const h = doc.internal.pageSize.height;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, h - 12, 297, 12, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.text(`EI DRONES37 — SIRET ${COMPANY.siret} — NDA ${COMPANY.nda}`, 148.5, h - 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
}

// ===================== ATTESTATION DE SUIVI =====================

export function generateAttestationPDF(student: Student) {
  const doc = new jsPDF();
  addHeader(doc);

  let y = 50;

  // Title
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(30, y - 5, 150, 14, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ATTESTATION DE SUIVI DE FORMATION", 105, y + 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 22;

  // Intro
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Je soussigné, ${COMPANY.owner}, représentant l'organisme de formation ${COMPANY.name}, atteste que :`,
    20, y, { maxWidth: 170 }
  );
  y += 14;

  // Student info box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(20, y, 170, 20, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text(`${student.firstName} ${student.lastName}`, 105, y + 13, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 28;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("A suivi la formation pratique :", 20, y);
  y += 10;

  // Formation name
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(20, y - 5, 170, 16, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(student.formation.toUpperCase(), 105, y + 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 20;

  // Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const details = [
    "Cette formation entre dans le champ d'application du code du travail L 6353-1.",
    "",
    "Nature : Action d'acquisition, d'entretien ou de perfectionnement des connaissances",
  ];
  details.forEach(line => {
    doc.text(line, 20, y, { maxWidth: 170 });
    y += 6;
  });
  y += 4;

  const config = getFormationDocConfig(student.formation);

  // Objectives
  doc.setFont("helvetica", "bold");
  doc.text("Objectifs de la formation :", 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const objectives = config.objectives;
  objectives.forEach(obj => {
    doc.text(`•  ${obj}`, 25, y, { maxWidth: 160 });
    y += 8;
  });
  y += 4;

  // Formation details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Modalités de formation :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text("Présentielle", 75, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Date :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `du ${new Date(student.startDate).toLocaleDateString("fr-FR")} au ${new Date(student.endDate).toLocaleDateString("fr-FR")}`,
    40, y
  );
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Lieu :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text("Montlouis sur Loire", 40, y);
  y += 14;

  // Result checkboxes
  doc.setFontSize(10);
  const results = [
    { label: "Formation acquise", checked: student.status === "terminee" },
    { label: "Formation en cours d'acquisition", checked: student.status === "en_cours" },
    { label: "Formation non acquise", checked: false },
  ];
  results.forEach(r => {
    doc.setDrawColor(...COLORS.primary);
    doc.rect(25, y - 3.5, 4, 4);
    if (r.checked) {
      doc.setFillColor(...COLORS.accent);
      doc.rect(25.5, y - 3, 3, 3, "F");
    }
    doc.text(r.label, 33, y);
    y += 8;
  });
  y += 6;

  // Signature area
  doc.setFont("helvetica", "normal");
  doc.text(`Fait à Montlouis sur Loire, le ${new Date().toLocaleDateString("fr-FR")}`, 20, y);
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.owner, 140, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Représentant de l'organisme de formation", 140, y, { align: "center" });

  addFooter(doc);

  doc.save(`Attestation_${student.firstName}_${student.lastName}.pdf`);
}

// ===================== LIVRET DE PROGRESSION =====================

export function generateProgressionPDF(progression: ProgressionSheet) {
  const doc = new jsPDF();

  // ---- PAGE 1: Couverture ----
  addHeader(doc);
  let y = 50;

  // Title block
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(25, y - 3, 160, 16, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LIVRET DE PROGRESSION", 105, y + 7, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 24;

  // Formation type
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(20, y, 170, 14, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(progression.formation.toUpperCase(), 105, y + 9, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 26;

  // Student info
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 36, 3, 3, "F");
  y += 9;
  doc.setFontSize(10);
  const infoLeft = [
    ["Stagiaire :", progression.studentName],
    ["Formation :", progression.formation],
    ["Formateur :", progression.instructorName],
  ];
  const infoRight = [
    ["Du :", new Date(progression.startDate).toLocaleDateString("fr-FR")],
    ["Au :", new Date(progression.endDate).toLocaleDateString("fr-FR")],
    ["Lieu :", "Montlouis sur Loire"],
  ];
  infoLeft.forEach(([label, val], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, y + i * 9);
    doc.setFont("helvetica", "normal");
    doc.text(val, 55, y + i * 9);
  });
  infoRight.forEach(([label, val], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 120, y + i * 9);
    doc.setFont("helvetica", "normal");
    doc.text(val, 140, y + i * 9);
  });
  y += 36;

  // Mise à jour
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(`Dernière mise à jour le ${new Date().toLocaleDateString("fr-FR")}`, 105, y, { align: "center" });

  addFooter(doc, 1, 4);

  // ---- PAGE 2: Évaluation début de formation ----
  doc.addPage();
  addHeader(doc);
  y = 44;

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(25, y - 3, 160, 14, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ÉVALUATION DÉBUT DE FORMATION", 105, y + 6, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 18;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Indiquez le niveau de maîtrise sur chacun des items : 1 = Faible — 5 = Excellent", 105, y, { align: "center" });
  y += 8;

  // Evaluation table - début
  const evalStartRows = progression.modules.map(m => [
    m.name,
    m.ratingStart === 1 ? "●" : "",
    m.ratingStart === 2 ? "●" : "",
    m.ratingStart === 3 ? "●" : "",
    m.ratingStart === 4 ? "●" : "",
    m.ratingStart === 5 ? "●" : "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Évaluation des acquis à l'entrée", "1", "2", "3", "4", "5"]],
    body: evalStartRows,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { halign: "center", cellWidth: 12 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "center", cellWidth: 12 },
      5: { halign: "center", cellWidth: 12 },
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: { fillColor: [245, 248, 250] },
  });

  const afterStart = (doc as any).lastAutoTable?.finalY || y + 60;
  let sigY = afterStart + 15;

  // Signatures
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Nom - Prénom - Signature de l'instructeur", 20, sigY);
  doc.text("Nom - Prénom - Signature du Stagiaire", 120, sigY);
  sigY += 6;
  doc.setFont("helvetica", "normal");
  doc.text(progression.instructorName, 20, sigY);
  doc.text(progression.studentName, 120, sigY);
  sigY += 3;
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(20, sigY, 70, 25);
  doc.rect(120, sigY, 70, 25);

  addFooter(doc, 2, 4);

  // ---- PAGE 3: Évaluation fin de formation ----
  doc.addPage();
  addHeader(doc);
  y = 44;

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(25, y - 3, 160, 14, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ÉVALUATION FIN DE FORMATION", 105, y + 6, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 18;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Indiquez le niveau de maîtrise sur chacun des items : 1 = Faible — 5 = Excellent", 105, y, { align: "center" });
  y += 8;

  const evalEndRows = progression.modules.map(m => [
    m.name,
    m.ratingEnd === 1 ? "●" : "",
    m.ratingEnd === 2 ? "●" : "",
    m.ratingEnd === 3 ? "●" : "",
    m.ratingEnd === 4 ? "●" : "",
    m.ratingEnd === 5 ? "●" : "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Évaluation des acquis à l'issue de la formation", "1", "2", "3", "4", "5"]],
    body: evalEndRows,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { halign: "center", cellWidth: 12 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "center", cellWidth: 12 },
      5: { halign: "center", cellWidth: 12 },
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: { fillColor: [245, 248, 250] },
  });

  const afterEnd = (doc as any).lastAutoTable?.finalY || y + 60;
  sigY = afterEnd + 15;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Nom - Prénom - Signature de l'instructeur", 20, sigY);
  doc.text("Nom - Prénom - Signature du Stagiaire", 120, sigY);
  sigY += 6;
  doc.setFont("helvetica", "normal");
  doc.text(progression.instructorName, 20, sigY);
  doc.text(progression.studentName, 120, sigY);
  sigY += 3;
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(20, sigY, 70, 25);
  doc.rect(120, sigY, 70, 25);

  addFooter(doc, 3, 4);

  // ---- PAGE 4: Résultat global + Attestation ----
  doc.addPage();
  addHeader(doc);
  y = 44;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSULTAT GLOBAL", 105, y, { align: "center" });
  y += 14;

  // Global result checkboxes
  const results = [
    { label: "Formation acquise", key: "acquis", color: COLORS.success },
    { label: "Formation en cours d'acquisition", key: "en_cours", color: COLORS.warning },
    { label: "Formation non acquise", key: "non_acquis", color: COLORS.danger },
  ];

  results.forEach(r => {
    const checked = progression.globalResult === r.key;
    doc.setDrawColor(...COLORS.primary);
    doc.rect(40, y - 3.5, 5, 5);
    if (checked) {
      doc.setFillColor(...r.color);
      doc.rect(40.5, y - 3, 4, 4, "F");
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(r.label, 50, y);
    y += 10;
  });

  y += 10;

  // Stats summary
  const acquis = progression.modules.filter(m => m.status === "acquis").length;
  const total = progression.modules.length;
  const pct = Math.round((acquis / total) * 100);

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(30, y, 150, 25, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Progression globale :", 40, y + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`${acquis}/${total} items acquis (${pct}%)`, 40, y + 18);

  // Progress bar
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(120, y + 8, 50, 6, 2, 2, "F");
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(120, y + 8, Math.max(2, 50 * (pct / 100)), 6, 2, 2, "F");
  y += 38;

  // Observations
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Observations du formateur :", 20, y);
  y += 5;
  doc.setDrawColor(...COLORS.lightGray);
  for (let i = 0; i < 5; i++) {
    y += 8;
    doc.line(20, y, 190, y);
  }
  y += 16;

  // Signatures
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Fait à Montlouis sur Loire, le ${new Date().toLocaleDateString("fr-FR")}`, 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Le formateur", 55, y, { align: "center" });
  doc.text("Le stagiaire", 155, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(progression.instructorName, 55, y, { align: "center" });
  doc.text(progression.studentName, 155, y, { align: "center" });
  y += 4;

  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(20, y, 70, 30);
  doc.rect(120, y, 70, 30);

  addFooter(doc, 4, 4);

  doc.save(`Livret_Progression_${progression.studentName.replace(/\s+/g, "_")}.pdf`);
}

// ===================== CONVOCATION =====================

export function generateConvocationPDF(student: Student) {
  const doc = new jsPDF();
  addHeader(doc);
  const config = getFormationDocConfig(student.formation);

  let y = 50;

  // Title
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(20, y - 5, 170, 16, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CONVOCATION À UNE FORMATION", 105, y + 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 22;

  // Subtitle
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(20, y, 170, 12, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.text(student.formation.toUpperCase(), 105, y + 8, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 22;

  // Date & place
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`À Montlouis sur Loire, le ${new Date().toLocaleDateString("fr-FR")}`, 20, y);
  y += 14;

  // Recipient
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${student.firstName} ${student.lastName}`, 20, y);
  y += 14;

  // Body text
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Vous êtes convoqué(e) à la formation "${student.formation}".`, 20, y, { maxWidth: 170 });
  y += 14;

  // Details box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(20, y, 170, 55, 3, 3, "F");
  y += 10;

  const details = [
    ["Lieu :", COMPANY.address],
    ["Durée :", `${config.dureeLabel} — du ${new Date(student.startDate).toLocaleDateString("fr-FR")} au ${new Date(student.endDate).toLocaleDateString("fr-FR")}`],
    ["Horaire :", "09h00"],
    ["Prérequis :", config.prerequis],
    ["Matériel demandé :", config.materiel],
  ];

  details.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 25, y);
    doc.setFont("helvetica", "normal");
    const labelWidth = doc.getTextWidth(label) + 3;
    doc.text(val, 25 + labelWidth, y, { maxWidth: 155 - labelWidth });
    y += 10;
  });

  y += 6;

  // Objectives
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Objectifs de la formation :", 20, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  config.objectives.forEach(obj => {
    doc.text(`•  ${obj}`, 25, y, { maxWidth: 160 });
    y += 7;
  });
  y += 8;

  // Signature
  doc.setFont("helvetica", "normal");
  doc.text("Le responsable de formation,", 20, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.owner, 20, y);
  y += 5;
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(20, y, 70, 25);

  addFooter(doc);
  doc.save(`Convocation_${student.firstName}_${student.lastName}.pdf`);
}

// ===================== CONVENTION =====================

export function generateConventionPDF(student: Student) {
  const doc = new jsPDF();
  addHeader(doc);
  const config = getFormationDocConfig(student.formation);
  const evaluationItems = getModulesForFormation(student.formation);

  let y = 48;

  // Title
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(15, y - 5, 180, 16, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("CONVENTION DE FORMATION PROFESSIONNELLE", 105, y + 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 18;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("(Articles L. 6353-1 et D.6353-1 du Code du travail)", 105, y, { align: "center" });
  y += 10;

  // Between parties
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Entre les soussignés :", 20, y);
  y += 8;

  // OF info
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(20, y, 170, 28, 3, 3, "F");
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("L'Organisme de Formation :", 25, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`${COMPANY.name} — ${COMPANY.owner}`, 25, y);
  y += 5;
  doc.text(`${COMPANY.address}`, 25, y);
  y += 5;
  doc.text(`SIRET : ${COMPANY.siret} — NDA : ${COMPANY.nda}`, 25, y);
  y += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Et le stagiaire :", 25, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`${student.firstName} ${student.lastName}`, 25, y);
  if (student.email) { y += 5; doc.text(`Email : ${student.email}`, 25, y); }
  if (student.phone) { y += 5; doc.text(`Tél : ${student.phone}`, 25, y); }
  y += 12;

  // Article I - Objet
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.accent);
  doc.text("I — OBJET DE LA CONVENTION", 20, y);
  doc.setTextColor(...COLORS.text);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`L'organisme de formation organisera l'action de formation suivante :`, 20, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(student.formation, 20, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Durée : ${config.dureeLabel} — Prérequis : ${config.prerequis}`, 20, y);
  y += 10;

  // Article II - Objectifs
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text("II — OBJECTIFS DE LA FORMATION", 20, y);
  doc.setTextColor(...COLORS.text);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  config.objectives.forEach(obj => {
    doc.text(`•  ${obj}`, 25, y, { maxWidth: 160 });
    y += 7;
  });
  y += 4;

  // Article III - Programme / Items d'évaluation
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text("III — PROGRAMME ET ITEMS D'ÉVALUATION", 20, y);
  doc.setTextColor(...COLORS.text);
  y += 7;

  // Evaluation items table
  const itemRows = evaluationItems.map((item, i) => [(i + 1).toString(), item.name]);

  autoTable(doc, {
    startY: y,
    head: [["N°", "Compétence / Item évalué"]],
    body: itemRows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: { 0: { halign: "center", cellWidth: 12 }, 1: { cellWidth: 155 } },
    margin: { left: 20, right: 20 },
    alternateRowStyles: { fillColor: [250, 248, 243] },
  });

  y = (doc as any).lastAutoTable?.finalY || y + 40;
  y += 8;

  // Check if we need a new page
  if (y > 230) {
    doc.addPage();
    addHeader(doc);
    y = 44;
  }

  // Article IV - Modalités
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text("IV — MODALITÉS DE DÉROULEMENT", 20, y);
  doc.setTextColor(...COLORS.text);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date : du ${new Date(student.startDate).toLocaleDateString("fr-FR")} au ${new Date(student.endDate).toLocaleDateString("fr-FR")}`, 20, y);
  y += 6;
  doc.text(`Lieu : ${COMPANY.address}`, 20, y);
  y += 6;
  doc.text("Modalité : Formation présentielle", 20, y);
  y += 10;

  // Article V - Évaluation
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.accent);
  doc.text("V — MOYENS D'ÉVALUATION", 20, y);
  doc.setTextColor(...COLORS.text);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Feuilles de présence signées par les stagiaires et le formateur par demi-journée.", 20, y, { maxWidth: 170 });
  y += 6;
  doc.text("Mise en situation concrète et évaluation pratique en continu.", 20, y, { maxWidth: 170 });
  y += 6;
  doc.text("Livret de progression individuel avec notation des acquis (1 à 5).", 20, y, { maxWidth: 170 });
  y += 14;

  // Signatures
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fait à Montlouis sur Loire, le ${new Date().toLocaleDateString("fr-FR")}, en deux exemplaires.`, 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Le Stagiaire bénéficiaire", 50, y, { align: "center" });
  doc.text("L'organisme de formation", 160, y, { align: "center" });
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Cachet, nom, qualité et signature", 50, y, { align: "center" });
  doc.text("Cachet, nom, qualité et signature", 160, y, { align: "center" });
  y += 4;
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(15, y, 70, 30);
  doc.rect(125, y, 70, 30);

  addFooter(doc);
  doc.save(`Convention_${student.firstName}_${student.lastName}.pdf`);
}

// ===================== QUESTIONNAIRE SATISFACTION PDF =====================

export function generateSatisfactionPDF(response: SatisfactionResponse) {
  const doc = new jsPDF();
  addHeader(doc);

  let y = 48;

  const title = response.type === "chaud" ? "QUESTIONNAIRE DE SATISFACTION À CHAUD" : "QUESTIONNAIRE DE SATISFACTION À FROID";
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(15, y - 5, 180, 16, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, y + 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 20;

  // Student info
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(20, y, 170, 22, 3, 3, "F");
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Nom / Prénom :", 25, y); doc.setFont("helvetica", "normal"); doc.text(response.studentName, 65, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Formation :", 25, y); doc.setFont("helvetica", "normal"); doc.text(response.formation, 55, y);
  doc.setFont("helvetica", "bold"); doc.text("Date :", 130, y); doc.setFont("helvetica", "normal"); doc.text(new Date(response.date).toLocaleDateString("fr-FR"), 145, y);
  y += 14;

  // Questions table
  const rows = response.questions.map(q => [
    q.text,
    q.rating === 1 ? "●" : "",
    q.rating === 2 ? "●" : "",
    q.rating === 3 ? "●" : "",
    q.rating === 4 ? "●" : "",
    q.rating === 5 ? "●" : "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Question", "1", "2", "3", "4", "5"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 9, halign: "center" },
    bodyStyles: { fontSize: 8.5, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { halign: "center", cellWidth: 12 },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "center", cellWidth: 12 },
      5: { halign: "center", cellWidth: 12 },
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: { fillColor: [250, 248, 243] },
  });

  const afterTable = (doc as any).lastAutoTable?.finalY || y + 60;
  y = afterTable + 12;

  // Average
  const avg = response.questions.reduce((sum, q) => sum + q.rating, 0) / response.questions.length;
  const pct = Math.round((avg / 5) * 100);
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(20, y, 170, 14, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Satisfaction globale : ${pct}% (${avg.toFixed(1)}/5)`, 105, y + 9, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 22;

  // Comment
  if (response.comment) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Commentaires / Suggestions :", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.text(response.comment, 20, y, { maxWidth: 170 });
  }

  addFooter(doc);
  doc.save(`Questionnaire_${response.type}_${response.studentName.replace(/\s+/g, "_")}.pdf`);
}

// ===================== FICHE ORIENTATION PSH =====================

export function generatePshOrientationPdf() {
  const doc = new jsPDF();
  addHeader(doc);

  let y = 42;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("FICHE D'ORIENTATION — PERSONNE EN SITUATION DE HANDICAP", 105, y, { align: "center" });
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.text);
  doc.text("Document remis au bénéficiaire pour faciliter son orientation vers les structures compétentes", 105, y, { align: "center" });
  y += 10;

  // Accent bar
  doc.setFillColor(...COLORS.accent);
  doc.rect(15, y, 180, 1.5, "F");
  y += 8;

  // Référent handicap
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 28, 3, 3, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Votre référent handicap DRONES37", 20, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text(`${COMPANY.owner}`, 20, y + 14);
  doc.text(`Tél : ${COMPANY.phone}  |  Email : ${COMPANY.email}`, 20, y + 20);
  doc.text(`Adresse : ${COMPANY.address}`, 20, y + 26);
  y += 36;

  // Introduction
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const intro = "En tant qu'organisme de formation certifié Qualiopi, DRONES37 s'engage à vous accompagner dans votre parcours de formation. Si vous êtes en situation de handicap, plusieurs organismes spécialisés peuvent vous aider à identifier les aménagements nécessaires et vous orienter vers les interlocuteurs adaptés à votre situation.";
  const introLines = doc.splitTextToSize(intro, 175);
  doc.text(introLines, 18, y);
  y += introLines.length * 4.5 + 6;

  // Structures d'orientation
  const structures = [
    {
      name: "AGEFIPH Centre-Val de Loire",
      role: "Aides financières et techniques pour les travailleurs handicapés du secteur privé",
      contact: "www.agefiph.fr — 0 800 11 10 09 (gratuit)",
      what: "Financement d'aménagements, aides à la formation, accompagnement personnalisé",
    },
    {
      name: "Cap Emploi 37 (Indre-et-Loire)",
      role: "Accompagnement vers et dans l'emploi des personnes handicapées",
      contact: "02 47 25 29 00 — Tours",
      what: "Conseil, orientation professionnelle, aide au maintien dans l'emploi",
    },
    {
      name: "MDPH d'Indre-et-Loire",
      role: "Maison Départementale des Personnes Handicapées",
      contact: "02 47 75 26 66 — 38 rue Edouard Vaillant, 37000 Tours",
      what: "Reconnaissance du handicap (RQTH), orientation, droits et prestations",
    },
    {
      name: "Ressource Handicap Formation (RHF)",
      role: "Appui aux organismes de formation et aux stagiaires",
      contact: "Contactez votre conseiller Pôle emploi ou Mission locale",
      what: "Analyse des besoins de compensation, appui à la sécurisation du parcours de formation",
    },
    {
      name: "Pôle France Travail — Référent handicap",
      role: "Accompagnement spécifique des demandeurs d'emploi en situation de handicap",
      contact: "3949 — www.francetravail.fr",
      what: "Orientation vers les dispositifs adaptés, financement de formation",
    },
    {
      name: "APF France Handicap — Délégation 37",
      role: "Défense des droits et accompagnement des personnes handicapées",
      contact: "02 47 27 64 44 — Tours",
      what: "Écoute, information, défense des droits, orientation sociale",
    },
  ];

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Structures compétentes pour vous accompagner", 18, y);
  y += 8;

  structures.forEach((s) => {
    // Check page break
    if (y > 250) {
      doc.addPage();
      addHeader(doc);
      y = 42;
    }

    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(15, y, 180, 26, 2, 2, "F");

    // Accent left bar
    doc.setFillColor(...COLORS.accent);
    doc.rect(15, y, 2, 26, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(s.name, 21, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(s.role, 21, y + 11);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(`Ce qu'ils font pour vous : ${s.what}`, 21, y + 17);
    doc.setFont("helvetica", "bold");
    doc.text(`Contact : ${s.contact}`, 21, y + 23);

    y += 30;
  });

  // Encadré démarche
  if (y > 235) {
    doc.addPage();
    addHeader(doc);
    y = 42;
  }

  y += 4;
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(15, y, 180, 32, 3, 3, "F");
  doc.setDrawColor(...COLORS.accent);
  doc.roundedRect(15, y, 180, 32, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.accent);
  doc.text("Comment faire ?", 20, y + 7);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  const steps = [
    "1. Signalez votre situation à votre référent handicap DRONES37 (confidentiel)",
    "2. Contactez la structure la plus adaptée ci-dessus selon votre besoin",
    "3. Ensemble, nous identifierons les aménagements possibles pour votre formation",
    "4. Un suivi individualisé sera mis en place tout au long de votre parcours",
  ];
  steps.forEach((step, i) => {
    doc.text(step, 20, y + 13 + i * 5);
  });

  y += 40;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130, 130, 130);
  doc.text("Document établi dans le cadre de la certification Qualiopi n°211201_74 — Indicateur 26", 105, y, { align: "center" });
  doc.text(`Édité le ${new Date().toLocaleDateString("fr-FR")} — DRONES37, organisme de formation`, 105, y + 4, { align: "center" });

  addFooter(doc);
  doc.save("Fiche_Orientation_PSH_DRONES37.pdf");
}

// ===================== FICHE DE RÉCLAMATION =====================

export function generateReclamationPdf() {
  const doc = new jsPDF();
  addHeader(doc);

  let y = 42;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("FICHE DE RÉCLAMATION", 105, y, { align: "center" });
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.text);
  doc.text("Document à compléter et à retourner au responsable qualité pour traitement", 105, y, { align: "center" });
  y += 10;

  // Accent bar
  doc.setFillColor(...COLORS.accent);
  doc.rect(15, y, 180, 1.5, "F");
  y += 10;

  // Section 1 — Identification
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("1. Identification du réclamant", 15, y);
  y += 8;

  const fieldHeight = 10;
  const fields1 = [
    "Nom et prénom :",
    "Formation suivie :",
    "Date de la réclamation :",
    "Email / Téléphone :",
  ];

  fields1.forEach((label) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text(label, 18, y + 3);
    doc.setDrawColor(200, 200, 200);
    doc.line(70, y + 4, 195, y + 4);
    y += fieldHeight;
  });

  y += 6;

  // Section 2 — Objet
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("2. Objet de la réclamation", 15, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  doc.text("Cochez la catégorie concernée :", 18, y);
  y += 6;

  const categories = [
    "Contenu pédagogique",
    "Organisation / logistique",
    "Formateur / intervenant",
    "Conditions matérielles",
    "Évaluation / certification",
    "Autre (précisez ci-dessous)",
  ];

  categories.forEach((cat) => {
    doc.rect(20, y - 3, 3, 3);
    doc.setFontSize(9);
    doc.text(cat, 26, y);
    y += 6;
  });

  y += 4;

  // Section 3 — Description
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("3. Description détaillée", 15, y);
  y += 8;

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 40, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(15, y, 180, 40, 2, 2, "S");
  // Lines inside the box
  for (let i = 1; i <= 5; i++) {
    doc.setDrawColor(220, 220, 220);
    doc.line(18, y + i * 7, 192, y + i * 7);
  }
  y += 48;

  // Section 4 — Traitement (réservé à l'organisme)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("4. Traitement de la réclamation (réservé à l'organisme)", 15, y);
  y += 8;

  const fields2 = [
    "Date de réception :",
    "Analyse de la réclamation :",
  ];

  fields2.forEach((label) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text(label, 18, y + 3);
    doc.setDrawColor(200, 200, 200);
    doc.line(70, y + 4, 195, y + 4);
    y += fieldHeight;
  });

  y += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Actions correctives mises en place :", 18, y + 3);
  y += 6;

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 25, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(15, y, 180, 25, 2, 2, "S");
  for (let i = 1; i <= 3; i++) {
    doc.setDrawColor(220, 220, 220);
    doc.line(18, y + i * 6, 192, y + i * 6);
  }
  y += 30;

  // Signatures
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("Date de clôture : ____/____/________", 18, y + 3);
  y += 10;

  doc.text("Signature du réclamant :", 18, y);
  doc.text("Signature du responsable :", 115, y);
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.rect(18, y, 70, 20);
  doc.rect(115, y, 70, 20);

  y += 28;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130, 130, 130);
  doc.text("Document établi dans le cadre de la certification Qualiopi — Procédure de traitement des réclamations", 105, y, { align: "center" });
  doc.text(`Édité le ${new Date().toLocaleDateString("fr-FR")} — DRONES37, organisme de formation`, 105, y + 4, { align: "center" });

  addFooter(doc);
  doc.save("Fiche_Reclamation_DRONES37.pdf");
}
