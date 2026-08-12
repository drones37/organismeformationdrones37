import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student } from "./store";

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
  primary: [56, 140, 195] as [number, number, number],
  accent: [229, 165, 0] as [number, number, number],
  text: [30, 50, 70] as [number, number, number],
  lightGray: [230, 240, 248] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  medGray: [160, 175, 190] as [number, number, number],
};

function addHeader(doc: jsPDF) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DRONES37", 15, 14);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("ORGANISME DE FORMATION", 15, 20);
  doc.setFontSize(7);
  doc.text(COMPANY.address, 195, 10, { align: "right" });
  doc.text(`Tél: ${COMPANY.phone} | ${COMPANY.email}`, 195, 15, { align: "right" });
  doc.text(`NDA: ${COMPANY.nda}`, 195, 20, { align: "right" });
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 28, 210, 2, "F");
  doc.setTextColor(...COLORS.text);
}

function addFooter(doc: jsPDF) {
  const h = doc.internal.pageSize.height;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, h - 12, 210, 12, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.text(`DRONES37 — Checklist d'entrée en formation — ${COMPANY.address}`, 105, h - 5, { align: "center" });
  doc.setTextColor(...COLORS.text);
}

export function generateEntryChecklistPDF(student: Student) {
  const doc = new jsPDF();
  addHeader(doc);

  // Title
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CHECKLIST DES PIÈCES À FOURNIR", 105, 42, { align: "center" });
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("À l'entrée en formation", 105, 49, { align: "center" });

  // Student info block
  let y = 56;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y - 2, 180, 26, 3, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Stagiaire :", 20, y + 4);
  doc.setFont("helvetica", "normal");
  doc.text(`${student.firstName} ${student.lastName}`, 55, y + 4);
  doc.setFont("helvetica", "bold");
  doc.text("Formation :", 20, y + 11);
  doc.setFont("helvetica", "normal");
  doc.text(student.formation, 55, y + 11);
  doc.setFont("helvetica", "bold");
  doc.text("Période :", 20, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${new Date(student.startDate).toLocaleDateString("fr-FR")} au ${new Date(student.endDate).toLocaleDateString("fr-FR")}`,
    55,
    y + 18
  );

  // Checklist table
  const checklistItems = [
    "Entretien de positionnement réalisé avec l'organisme de formation",
    "Preuve d'usage professionnel du drone dans le secteur d'activités visé",
    "Copie du BAPD (Brevet d'Aptitude de Pilote à Distance) en cours de validité",
    "Copie du CATS (Certificat d'Aptitude Théorique Scénarios standards) en cours de validité",
    "Capacité à repasser les examens théoriques DGAC si nécessaire",
    "Copie recto/verso de la pièce d'identité en cours de validité",
    "Droit à l'image signé, daté et complété",
    "Règlement intérieur, CGU et CGV signés",
  ];

  const body = checklistItems.map((item, i) => [
    (i + 1).toString(),
    item,
    "", // Fourni (checkbox drawn by hook)
    "",
    "",
  ]);

  autoTable(doc, {
    startY: 88,
    head: [["N°", "Pièce / document à fournir", "Fourni", "Date", "Remarques"]],
    body,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },
    bodyStyles: { fontSize: 8.5, cellPadding: 3, valign: "middle" },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    columnStyles: {
      0: { halign: "center", cellWidth: 12, fontStyle: "bold" },
      1: { cellWidth: 88 },
      2: { halign: "center", cellWidth: 24 },
      3: { halign: "center", cellWidth: 28 },
      4: { cellWidth: 40 },
    },
    margin: { left: 15, right: 15 },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const { x, y, width, height } = data.cell;
        doc.setDrawColor(...COLORS.medGray);
        doc.setLineWidth(0.3);
        doc.rect(x + width / 2 - 3.5, y + height / 2 - 3.5, 7, 7, "S");
      }
    },
  });

  y = (doc as any).lastAutoTable?.finalY + 10 || 180;

  // Notes
  y += 2;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COLORS.text);
  doc.text(
    "BAPD : Brevet d'Aptitude de Pilote à Distance (catégorie ouverte) — CATS : Certificat d'Aptitude Théorique Scénarios standards (catégorie spécifique).",
    15,
    y,
    { maxWidth: 180 }
  );
  y += 8;
  doc.text(
    "Si le stagiaire n'est pas en possession du BAPD et/ou du CATS, il doit être en capacité de se présenter aux examens théoriques DGAC avant la validation pratique.",
    15,
    y,
    { maxWidth: 180 }
  );

  // Signature boxes
  y += 16;
  if (y + 40 > 270) {
    doc.addPage();
    addHeader(doc);
    y = 45;
  }

  doc.setDrawColor(...COLORS.medGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, 85, 40, 2, 2, "S");
  doc.roundedRect(110, y, 85, 40, 2, 2, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("Stagiaire :", 20, y + 8);
  doc.setFont("helvetica", "normal");
  doc.text(`${student.firstName} ${student.lastName}`, 20, y + 15);
  doc.setFont("helvetica", "bold");
  doc.text("Signature :", 20, y + 28);

  doc.setFont("helvetica", "bold");
  doc.text("Formateur / Référent :", 115, y + 8);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.owner, 115, y + 15);
  doc.setFont("helvetica", "bold");
  doc.text("Signature :", 115, y + 28);

  addFooter(doc);

  doc.save(`checklist-entree-${student.lastName}-${student.firstName}.pdf`);
}
