import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttendanceSheet, ProgressionSheet, Student, SatisfactionResponse } from "./store";

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

  // Objectives
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Objectifs de la formation :", 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const objectives = [
    "Connaître et appliquer la réglementation en vigueur concernant l'usage professionnel de drone civil",
    "Maîtriser le télépilotage d'un drone civil dans le cadre d'une activité professionnelle",
    "Assurer le suivi administratif indissociable de l'activité",
    "Maîtriser la préparation du vol mission dans le cadre des scénarios STS-01",
  ];
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
