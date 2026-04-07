import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttendanceSheet, ProgressionSheet, Student } from "./store";

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
  primary: [21, 67, 96] as [number, number, number],     // dark blue
  accent: [26, 188, 156] as [number, number, number],     // teal
  text: [44, 62, 80] as [number, number, number],
  lightGray: [236, 240, 241] as [number, number, number],
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
  const doc = new jsPDF();
  addHeader(doc);

  let y = 44;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FEUILLE D'ÉMARGEMENT", 105, y, { align: "center" });
  y += 10;

  // Info block
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 30, 3, 3, "F");
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Session :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(sheet.title, 50, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Formation :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(sheet.formation, 50, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Date :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(sheet.date).toLocaleDateString("fr-FR"), 50, y);
  doc.setFont("helvetica", "bold");
  doc.text("Lieu :", 110, y);
  doc.setFont("helvetica", "normal");
  doc.text("Montlouis sur Loire", 130, y);
  y += 7;

  // Horaires
  doc.setFont("helvetica", "bold");
  doc.text("Horaires :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text("09h00 - 13h00 / 14h00 - 17h00", 50, y);
  y += 10;

  // Formateur
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(15, y, 180, 12, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FORMATEUR : " + COMPANY.owner, 20, y + 8);
  doc.text("Signature : ____________________", 120, y + 8);
  doc.setTextColor(...COLORS.text);
  y += 20;

  // Table
  const tableData = sheet.students.map((s, i) => [
    (i + 1).toString(),
    s.studentName,
    "",
    s.signed ? "✓" : "",
    s.signedAt || "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["N°", "Stagiaire", "Entreprise", "Émargement Matin", "Émargement Après-midi"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      minCellHeight: 18,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { halign: "center", cellWidth: 42 },
      4: { halign: "center", cellWidth: 42 },
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: { fillColor: [245, 248, 250] },
  });

  // Signature images
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  let sigY = finalY + 5;

  sheet.students.forEach((s) => {
    if (s.signed && s.signatureData) {
      try {
        doc.addImage(s.signatureData, "PNG", 120, sigY - 16, 30, 12);
      } catch {
        // skip if image fails
      }
    }
  });

  addFooter(doc);

  doc.save(`Emargement_${sheet.title.replace(/\s+/g, "_")}.pdf`);
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
  const totalPages = 2;

  // ---- PAGE 1 ----
  addHeader(doc);
  let y = 44;

  // Title
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(25, y - 3, 160, 16, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LIVRET DE PROGRESSION", 105, y + 7, { align: "center" });
  doc.setTextColor(...COLORS.text);
  y += 22;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Télépilote professionnel de drone", 105, y, { align: "center" });
  y += 12;

  // Student info
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, 180, 36, 3, 3, "F");
  y += 9;
  doc.setFontSize(10);
  const infoLeft = [
    ["Stagiaire :", `${progression.studentName}`],
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

  // Modules table
  const statusLabel = (s: string) => {
    switch (s) {
      case "acquis": return "Acquis ✓";
      case "en_cours": return "En cours";
      case "non_acquis": return "Non acquis";
      default: return "Non évalué";
    }
  };

  const moduleRows = progression.modules.map((m, i) => [
    (i + 1).toString(),
    m.name,
    m.objectives.join("\n"),
    statusLabel(m.status),
    m.evaluatedAt || "-",
    m.comment || "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["N°", "Module", "Objectifs", "Statut", "Date", "Remarques"]],
    body: moduleRows,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 32, fontStyle: "bold" },
      2: { cellWidth: 55 },
      3: { halign: "center", cellWidth: 22 },
      4: { halign: "center", cellWidth: 20 },
      5: { cellWidth: 35 },
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val.includes("Acquis")) data.cell.styles.textColor = COLORS.success;
        else if (val.includes("En cours")) data.cell.styles.textColor = COLORS.warning;
        else if (val.includes("Non acquis")) data.cell.styles.textColor = COLORS.danger;
      }
    },
  });

  addFooter(doc, 1, totalPages);

  // ---- PAGE 2: Global result + Signatures ----
  doc.addPage();
  addHeader(doc);
  y = 44;

  // Global result
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSULTAT GLOBAL", 105, y, { align: "center" });
  y += 14;

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
  doc.text(`${acquis}/${total} modules acquis (${pct}%)`, 40, y + 18);

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

  // Two signature columns
  doc.setFont("helvetica", "bold");
  doc.text("Le formateur", 55, y, { align: "center" });
  doc.text("Le stagiaire", 155, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(progression.instructorName, 55, y, { align: "center" });
  doc.text(progression.studentName, 155, y, { align: "center" });
  y += 4;

  // Signature boxes
  doc.setDrawColor(...COLORS.lightGray);
  doc.rect(20, y, 70, 30);
  doc.rect(120, y, 70, 30);

  addFooter(doc, 2, totalPages);

  doc.save(`Livret_Progression_${progression.studentName.replace(/\s+/g, "_")}.pdf`);
}
