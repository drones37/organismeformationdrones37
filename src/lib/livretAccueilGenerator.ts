import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student } from "./store";
import { getModulesForFormation } from "./formationModules";

const COMPANY = {
  name: "DRONES37",
  owner: "PELARD Stéphane",
  address: "19 rue Madeleine Vernet, 37270 Montlouis sur Loire",
  phone: "06 51 11 27 02",
  email: "contact@drones37.com",
  siret: "497 986 604 00021",
  nda: "24370471537",
  qualiopiCert: "211201_74",
  qualiopiDate: "16/12/2024",
};

const COLORS = {
  primary: [56, 140, 195] as [number, number, number],    // bleu ciel
  accent: [229, 165, 0] as [number, number, number],      // jaune doré
  text: [30, 50, 70] as [number, number, number],
  lightGray: [230, 240, 248] as [number, number, number], // bleu très clair
  white: [255, 255, 255] as [number, number, number],
  medGray: [160, 175, 190] as [number, number, number],
  dark: [25, 55, 80] as [number, number, number],         // bleu foncé
};

interface FormationConfig {
  title: string;
  subtitle: string;
  objectives: string[];
  prerequis: string;
  duree: string;
  materiel: string;
  publicVise: string;
}

function getFormationConfig(formation: string): FormationConfig {
  const lower = formation.toLowerCase();
  if (lower.includes("pulvé") || lower.includes("bâtiment")) {
    return {
      title: "Pulvérisation sur bâtiments par drone",
      subtitle: "Formation pratique spécialisée",
      objectives: [
        "Connaître et appliquer la réglementation en vigueur concernant l'usage professionnel de drone civil",
        "Maîtriser le télépilotage d'un drone dans le cadre de missions de pulvérisation sur bâtiments",
        "Connaître les produits de traitement et leurs utilisations",
        "Maîtriser les équipements de protection individuelle et le matériel de pulvérisation",
        "Réaliser des missions de pulvérisation par drone en conformité avec le cadre réglementaire",
        "Obtenir l'Attestation de suivi de formation pratique et le Livret de progression",
      ],
      prerequis: "Être titulaire du CATT (Certificat d'Aptitude au Télépilotage Théorique) ou équivalent.",
      duree: "5 jours (35 heures)",
      materiel: "Matériel pour écrire, tenue de travail adaptée au chantier, EPI, matériel informatique.",
      publicVise: "Professionnels souhaitant se spécialiser dans la pulvérisation sur bâtiments par drone.",
    };
  }
  if (lower.includes("a1") || lower.includes("a3") || lower.includes("ouverte")) {
    return {
      title: "Catégorie ouverte A1/A3",
      subtitle: "Formation théorique et pratique",
      objectives: [
        "Connaître la réglementation européenne applicable à la catégorie ouverte (A1, A2, A3)",
        "Connaître les classes d'UAS et les limitations de masse et de vitesse",
        "Préparer et effectuer un vol en catégorie ouverte en toute sécurité",
        "Gérer les situations d'urgence et appliquer les règles de sécurité",
        "Obtenir le BAPD (Brevet d'Aptitude de Pilote à Distance) A1/A3 via AlphaTango",
      ],
      prerequis: "Aucun prérequis spécifique.",
      duree: "2 jours (14 heures)",
      materiel: "Matériel pour écrire, tenue décontractée, matériel informatique avec accès internet.",
      publicVise: "Toute personne souhaitant utiliser un drone en catégorie ouverte.",
    };
  }
  return {
    title: "Télépilote Drone STS-01/STS-02",
    subtitle: "Formation pratique télépilote professionnel",
    objectives: [
      "Connaître et appliquer la réglementation européenne et française concernant l'usage professionnel de drone civil",
      "Assurer le suivi administratif indissociable de l'activité (MANEX, AlphaTango, DGAC)",
      "Maîtriser la préparation du vol mission et la lecture des cartes aéronautiques",
      "Télépiloter un drone en situations normale et anormale dans le cadre des scénarios STS-01/STS-02",
      "Gérer les situations dégradées et appliquer les procédures d'urgence",
      "Obtenir l'Attestation de suivi de formation pratique et le Livret de progression",
    ],
    prerequis: "Être titulaire du CATT (Certificat d'Aptitude au Télépilotage Théorique) ou équivalent.",
    duree: "5 jours (35 heures)",
    materiel: "Matériel pour écrire, tenue décontractée, équipement météo, matériel informatique avec carte SD.",
    publicVise: "Toute personne souhaitant exercer en tant que télépilote professionnel de drone.",
  };
}

// ==================== HEADER / FOOTER ====================
function addHeader(doc: jsPDF, pageTitle?: string) {
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
  if (pageTitle) {
    doc.setTextColor(...COLORS.accent);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(pageTitle.toUpperCase(), 105, 35, { align: "center" });
  }
  doc.setTextColor(...COLORS.text);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const h = doc.internal.pageSize.height;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, h - 12, 210, 12, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.text(`DRONES37 — Livret d'accueil — ${COMPANY.address}`, 105, h - 5, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, 200, h - 5, { align: "right" });
  doc.setTextColor(...COLORS.text);
}

function addSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(15, y - 4, 180, 12, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 105, y + 4, { align: "center" });
  doc.setTextColor(...COLORS.text);
  return y + 16;
}

function addSubTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(20, y - 3, 170, 10, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(text, 105, y + 4, { align: "center" });
  doc.setTextColor(...COLORS.text);
  return y + 14;
}

function addParagraph(doc: jsPDF, text: string, y: number, options?: { fontSize?: number; maxWidth?: number; indent?: number }): number {
  const fs = options?.fontSize || 9;
  const mw = options?.maxWidth || 170;
  const indent = options?.indent || 20;
  doc.setFontSize(fs);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(text, mw);
  doc.text(lines, indent, y);
  return y + lines.length * (fs * 0.45) + 2;
}

function addBulletList(doc: jsPDF, items: string[], y: number, options?: { fontSize?: number; maxWidth?: number }): number {
  const fs = options?.fontSize || 9;
  const mw = options?.maxWidth || 160;
  doc.setFontSize(fs);
  doc.setFont("helvetica", "normal");
  items.forEach(item => {
    const lines = doc.splitTextToSize(item, mw);
    doc.text("•", 22, y);
    doc.text(lines, 27, y);
    y += lines.length * (fs * 0.45) + 2;
  });
  return y;
}

function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    addHeader(doc);
    return 40;
  }
  return y;
}

// ==================== MAIN GENERATOR ====================
export function generateLivretAccueilPDF(student: Student) {
  const config = getFormationConfig(student.formation);
  const modules = getModulesForFormation(student.formation);
  const doc = new jsPDF();
  const pages: (() => void)[] = [];

  // ======================== PAGE 1: COUVERTURE ========================
  pages.push(() => {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 297, "F");
    
    // Logo area
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(55, 30, 100, 40, 5, 5, "F");
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("DRONES37", 105, 52, { align: "center" });
    doc.setFontSize(10);
    doc.text("ORGANISME DE FORMATION", 105, 62, { align: "center" });

    // Main title
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("LIVRET D'ACCUEIL", 105, 110, { align: "center" });

    // Formation subtitle
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(20, 120, 170, 16, 3, 3, "F");
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.text(config.title.toUpperCase(), 105, 130, { align: "center" });

    // Student info
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Stagiaire", 105, 160, { align: "center" });
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${student.firstName} ${student.lastName}`, 105, 172, { align: "center" });

    // Dates
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Du ${new Date(student.startDate).toLocaleDateString("fr-FR")} au ${new Date(student.endDate).toLocaleDateString("fr-FR")}`, 105, 185, { align: "center" });

    // Bottom info
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.medGray);
    doc.text(COMPANY.address, 105, 260, { align: "center" });
    doc.text(`Tél: ${COMPANY.phone} — ${COMPANY.email}`, 105, 266, { align: "center" });
    doc.text(`NDA: ${COMPANY.nda} — Certifié QUALIOPI n°${COMPANY.qualiopiCert}`, 105, 272, { align: "center" });
  });

  // ======================== PAGE 2: SOMMAIRE ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "SOMMAIRE", 42);
    y += 4;

    const sommaire = [
      "1. L'entreprise DRONES37",
      "2. Certification QUALIOPI",
      "3. Organigramme — Une équipe disponible",
      "4. Votre formation",
      "   4.1 Objectifs de la formation",
      "   4.2 Mise en œuvre de l'action de formation",
      "   4.3 Modalités pédagogiques",
      "   4.4 Programme — Items d'évaluation",
      "5. Site de formation",
      "6. Constitution de votre dossier",
      "7. Règlement intérieur",
      "8. Conditions Générales d'Utilisation (CGU)",
      "9. Conditions Générales de Vente (CGV)",
      "10. Protection des données personnelles",
    ];

    doc.setFontSize(11);
    sommaire.forEach(item => {
      const isIndented = item.startsWith("   ");
      doc.setFont("helvetica", isIndented ? "normal" : "bold");
      doc.setFontSize(isIndented ? 9 : 10);
      doc.text(isIndented ? item : item, isIndented ? 30 : 20, y);
      y += isIndented ? 7 : 9;
    });
  });

  // (Page "Mot du gérant" supprimée)

  // ======================== PAGE 4: L'ENTREPRISE + QUALIOPI ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "L'entreprise DRONES37", 42);
    y += 4;

    y = addParagraph(doc, "DRONES37 est une entreprise spécialisée dans la pulvérisation sur bâtiments par drones, créée en septembre 2020. Elle propose à ses clients des traitements sur tout types de bâtiments par drones, des inspections techniques, des modélisations 3D et vues aériennes.", y);
    y += 4;
    y = addParagraph(doc, "DRONES37 est référencé auprès de la Direction Générale de l'Aviation Civile (DGAC) comme entreprise utilisatrice de drones et centre de formation. Les appareils utilisés sont certifiés conformes et les télépilotes sont membres de l'Union Nationale des Exploitants Professionnels d'Aéronefs Télépilotés (UNEPAT).", y);
    y += 4;
    y = addParagraph(doc, "DRONES37 est également membre de la Fédération Professionnelle du Drone Civil (FPDC) et est un organisme de formation déclaré auprès de la préfecture d'Indre et Loire sous le numéro 24370471537.", y);
    y += 8;

    // QUALIOPI section
    y = addSubTitle(doc, "Certification QUALIOPI", y);
    y += 4;

    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(15, y - 2, 180, 30, 3, 3, "F");
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`DRONES37 est certifié QUALIOPI (certificat n°${COMPANY.qualiopiCert}) depuis le ${COMPANY.qualiopiDate}`, 20, y);
    y += 5;
    doc.text("dans la catégorie « actions de formation ».", 20, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.text("Cette certification atteste de la qualité du processus de formation mise en œuvre auprès", 20, y);
    y += 5;
    doc.text("des stagiaires, ainsi que de notre engagement dans un cycle d'amélioration continue.", 20, y);
    y += 12;

    // Satisfaction
    y = addParagraph(doc, "100% de nos élèves sont satisfaits de leur formation télépilote professionnel de drone.", y);
    y += 4;
    y = addParagraph(doc, "Retrouvez nos prestations sur notre site internet : https://www.drones37.com", y);
  });

  // ======================== PAGE 5: ORGANIGRAMME ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Organigramme — Une équipe disponible", 42);
    y += 4;

    y = addParagraph(doc, "En choisissant la formation chez DRONES37, vous faites le choix d'une équipe pédagogique aux compétences multidisciplinaires, qui vous garantissent une adéquation complète entre le contenu de cette formation et les nécessités professionnelles.", y);
    y += 6;

    // Organigramme table
    autoTable(doc, {
      startY: y,
      head: [["Fonction", "Nom", "Contact"]],
      body: [
        ["Gérant / Directeur", "Stéphane PELARD", COMPANY.phone],
        ["Référent pédagogique / Formateur", "Stéphane PELARD", COMPANY.email],
        ["Référent administratif", "Stéphane PELARD", COMPANY.email],
        ["Référent handicap", "Stéphane PELARD", COMPANY.email],
        ["Formateur", "Cédric", "—"],
      ],
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 }, 1: { cellWidth: 55 }, 2: { cellWidth: 60 } },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable?.finalY + 10 || y + 60;

    y = addParagraph(doc, "Les membres de l'équipe ont tous été formés au télépilotage professionnel de drone chez DRONES37. Ils disposent d'un grand nombre d'heures de vol, aussi bien en prestations qu'en actions de formation.", y);
    y += 4;

    // Référent administratif
    y = addSubTitle(doc, "Mon référent administratif", y);
    y += 4;
    y = addParagraph(doc, "Stéphane vous accompagne à chaque étape de votre formation :", y);
    y = addBulletList(doc, [
      "Inscription à l'examen théorique DGAC (coût inclus dans le prix de formation)",
      "Transmission du code d'accès à la plateforme d'entraînement",
      "Édition d'attestation d'assiduité, de présence, de bilan de formation",
      "Gestion des absences et des retards",
    ], y);

    y += 4;
    y = addSubTitle(doc, "Mon interlocuteur handicap", y);
    y += 4;
    y = addParagraph(doc, "Stéphane répond à l'ensemble de vos questions pendant toute la durée de la formation.", y);
  });

  // ======================== PAGE 6-7: VOTRE FORMATION ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Votre formation", 42);
    y += 2;

    // Formation name
    y = addSubTitle(doc, config.title, y);
    y += 4;

    // Info block
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(15, y - 2, 180, 28, 3, 3, "F");
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Durée :", 20, y); doc.setFont("helvetica", "normal"); doc.text(config.duree, 50, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Prérequis :", 20, y); doc.setFont("helvetica", "normal"); doc.text(config.prerequis, 50, y, { maxWidth: 140 });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Public visé :", 20, y); doc.setFont("helvetica", "normal"); doc.text(config.publicVise, 50, y, { maxWidth: 140 });
    y += 10;

    // Objectifs
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Objectifs de la formation", 20, y);
    y += 6;
    y = addBulletList(doc, config.objectives, y);
    y += 4;

    // Mise en oeuvre
    y = checkNewPage(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Mise en œuvre de l'action de formation", 20, y);
    y += 6;
    y = addParagraph(doc, "Les programmes de formation sont souples et peuvent être réaménagés en fonction des contraintes, principalement météorologiques, de manière à optimiser le temps pratique de télépilotage.", y);
    y += 2;
    y = addParagraph(doc, "Les horaires de formation sont généralement de 9h00 à 13h00 et 14h00 à 17h00 et peuvent être réaménagés pour une optimisation du temps pratique.", y);
    y += 4;

    // Modalités
    y = checkNewPage(doc, y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Modalités pédagogiques", 20, y);
    y += 6;
    y = addBulletList(doc, [
      "Effectifs : 1 formateur pour un groupe de maximum 3 élèves",
      "En cas d'intempéries, les cours pratiques sont reconduits à l'heure suivante ou au lendemain",
      "Les formateurs restent à disposition tout au long et à la suite de la formation",
      `Matériel à prévoir : ${config.materiel}`,
    ], y);
    y += 4;

    // Modalités de suivi
    y = checkNewPage(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Modalité d'organisation et de suivi", 20, y);
    y += 6;
    y = addBulletList(doc, [
      "Émargement des stagiaires chaque demi-journée de formation",
      "Organisation des pauses en cours de formation",
      "Fourniture des documents et supports de cours à chaque participant",
      "Mise à disposition de tous les outils et accessoires nécessaires",
    ], y);
  });

  // ======================== PAGE 7: PROGRAMME (items d'évaluation) ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Programme — Items d'évaluation", 42);
    y += 2;

    y = addSubTitle(doc, config.title, y);
    y += 4;

    y = addParagraph(doc, "À l'issue de cette formation et sous réserve d'une marge de progression convenable, nous remettons à chaque élève un Livret de progression et une Attestation de suivi de formation.", y);
    y += 4;

    const tableData = modules.map((m, i) => [(i + 1).toString(), m.name]);

    autoTable(doc, {
      startY: y,
      head: [["N°", "Item d'évaluation"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      columnStyles: { 0: { halign: "center", cellWidth: 15 }, 1: { cellWidth: 165 } },
      margin: { left: 15, right: 15 },
    });
  });

  // ======================== PAGE 8: SITE DE FORMATION ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Site de formation", 42);
    y += 4;

    y = addParagraph(doc, "Les sessions de formations seront réalisées par DRONES37 dans les locaux, situés au 19 rue Madeleine Vernet, 37270 Montlouis sur Loire.", y);
    y += 2;
    y = addParagraph(doc, "Pour les personnes en situation de handicap, les sessions peuvent se passer au RUBIXCO, 1 rue Bernard Maris, 37270 Montlouis sur Loire, à 5 minutes du centre.", y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Accès", 20, y);
    y += 6;
    y = addBulletList(doc, [
      "En provenance de PARIS : A10 Sortie n°21",
      "En provenance de NANTES : A85/E60 Sortie D7",
      "La gare de St Pierre des Corps est située à 10 km",
    ], y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Les locaux de formation", 20, y);
    y += 6;
    y = addBulletList(doc, [
      "Tables et chaises",
      "Tableau blanc magnétique",
      "Écran LED",
      "Wifi",
      "Eau à disposition",
    ], y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Accessibilité handicapée (RUBIXCO)", 20, y);
    y += 6;
    y = addBulletList(doc, [
      "Plusieurs places de stationnement adaptées",
      "Sanitaires handicapés",
      "Bâtiment de plain-pied sans escalier",
      "Ouvertures et portes à passage utile ≥ 80 cm",
      "Terrain accessible en fauteuil roulant (enrobé)",
    ], y);
    y += 4;
    y = addParagraph(doc, "DRONES37 ne prendra pas en charge la locomotion des stagiaires sur les lieux de formation, leurs hébergements ainsi que leurs repas.", y, { fontSize: 8 });
  });

  // ======================== PAGE 9: CONSTITUTION DU DOSSIER ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Constitution de votre dossier d'inscription", 42);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Étape 1 : Signature des documents suivants :", 20, y);
    y += 6;
    y = addBulletList(doc, ["Règlement intérieur", "Conditions Générales d'Utilisation", "Conditions Générales de Vente"], y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Étape 2 : Renseigner, dater et signer le document suivant :", 20, y);
    y += 6;
    y = addBulletList(doc, ["Droit à l'image"], y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Étape 3 : Si vous avez moins de 18 ans :", 20, y);
    y += 6;
    y = addBulletList(doc, ["59FormExam à renseigner, dater et signer", "Numériser votre JAPD ou JDC"], y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Étape 4 : Numériser la copie recto/verso de votre carte d'identité en cours de validité", 20, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Étape 5 : Examen théorique DGAC", 20, y);
    y += 6;
    y = addBulletList(doc, [
      "Choisir un centre d'examen et une date",
      "Inscription faite par le centre de formation (coût inclus dans le prix)",
      "Compter un délai de 4 à 6 semaines après la fin de formation",
    ], y);
    y += 6;

    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(15, y - 2, 180, 16, 3, 3, "F");
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Documents à retourner à :", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.email, 75, y);
  });

  // ======================== PAGES 10-11: RÈGLEMENT INTÉRIEUR ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Règlement intérieur", 42);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Préambule", 20, y);
    y += 5;
    y = addParagraph(doc, `DRONES37 est un organisme de formation domicilié au ${COMPANY.address}. Il est enregistré sous le numéro de déclaration d'activité NDA ${COMPANY.nda} (auprès de la DREETS, Centre Val de Loire).`, y, { fontSize: 8 });
    y += 3;

    const articles = [
      { title: "Article 1 — Objet et champ d'application", text: "Le présent règlement est établi conformément aux dispositions des articles L.6352-3, L.6352-4 et R.6352-1 à R.6352-15 du Code du travail. Il s'applique à toutes les personnes participantes à une action de formation organisée par DRONES37." },
      { title: "Article 2 — Lieu de formation", text: "La formation a lieu soit dans les locaux de DRONES37, soit dans les locaux de RUBIXCO." },
      { title: "Article 3 — Principes généraux (hygiène et sécurité)", text: "La prévention des risques d'accidents et de maladies est impérative et exige de chacun le respect des prescriptions applicables en matière d'hygiène et de sécurité." },
      { title: "Article 4 — Consignes d'incendie", text: "Les consignes d'incendie et un plan de localisation des extincteurs et des issues de secours sont affichés dans les locaux. En cas d'alerte, le stagiaire doit suivre les instructions du formateur." },
      { title: "Article 5 — Boissons alcoolisées et drogues", text: "L'introduction ou la consommation de drogue ou de boissons alcoolisées dans les locaux de formation est formellement interdite." },
      { title: "Article 6 — Interdiction de fumer", text: "Il est formellement interdit de fumer dans les salles de formation." },
      { title: "Article 7 — Accident", text: "Le stagiaire ou le témoin d'un accident doit immédiatement avertir la direction de l'organisme de formation." },
      { title: "Article 8 — Horaires", text: "Les stagiaires doivent se conformer aux horaires fixés et communiqués au préalable par l'organisme de formation." },
      { title: "Article 9 — Absences et retards", text: "En cas d'absence, de retard ou de départ anticipé, les stagiaires doivent avertir l'organisme de formation et s'en justifier." },
      { title: "Article 10 — Suivi de la formation", text: "Le stagiaire est tenu de renseigner la feuille d'émargement au fur et à mesure du déroulement de l'action." },
      { title: "Article 11 — Accès aux locaux", text: "Sauf autorisation expresse, le stagiaire ne peut entrer dans les locaux à d'autres fins que la formation, ni y introduire des personnes étrangères." },
      { title: "Article 12 — Tenue et comportement", text: "Le stagiaire est invité à se présenter en tenue correcte. Le port de chaussures ouvertes et de shorts est interdit. L'usage des téléphones portables est interdit pendant la formation." },
      { title: "Article 13 — Utilisation du matériel", text: "L'usage du matériel est exclusivement réservé à l'activité de formation. Le stagiaire signale immédiatement toute anomalie." },
      { title: "Article 14 — Documentation pédagogique", text: "La documentation est protégée au titre des droits d'auteur et ne peut être réutilisée que pour un usage personnel." },
      { title: "Articles 15-18 — Sanctions", text: "Tout manquement pourra faire l'objet de sanctions : rappel à l'ordre, avertissement écrit, ou exclusion définitive. Aucune sanction ne peut être infligée sans information préalable des griefs retenus." },
    ];

    articles.forEach(a => {
      y = checkNewPage(doc, y, 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(a.title, 20, y);
      y += 4;
      y = addParagraph(doc, a.text, y, { fontSize: 8 });
      y += 2;
    });

    // Signature area
    y = checkNewPage(doc, y, 30);
    y += 4;
    doc.setDrawColor(...COLORS.medGray);
    doc.roundedRect(15, y, 85, 30, 2, 2, "S");
    doc.roundedRect(110, y, 85, 30, 2, 2, "S");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Stagiaire :", 20, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(`${student.firstName} ${student.lastName}`, 20, y + 12);
    doc.text("Signature :", 20, y + 20);

    doc.setFont("helvetica", "bold");
    doc.text("Formateur :", 115, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.owner, 115, y + 12);
    doc.text("Signature :", 115, y + 20);
  });

  // ======================== PAGES 12-13: CGU (résumé) ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Conditions Générales d'Utilisation (CGU)", 42);
    y += 4;

    const cguArticles = [
      { title: "Article 1 — Définitions", text: "« Action de formation » : les actions mentionnées à l'article L.6313-1 du Code du Travail. « Stagiaire » : la personne physique qui participe à la formation. « Session de formation » : la période de formation planifiée dans le temps." },
      { title: "Article 2 — Objet", text: "Les présentes CGU s'appliquent à toutes les personnes participantes à une Action de formation organisée par DRONES37." },
      { title: "Article 3 — Référencement", text: "Toutes les actions de formations sont référencées et consultables sur le site : https://www.drones37.com/" },
      { title: "Article 4 — Inscription et commande", text: "Le stagiaire peut contacter l'organisme via le formulaire de contact ou par téléphone au 06 51 11 27 02. Après validation, une convocation est adressée au stagiaire. Un délai de rétractation de 10 jours s'applique." },
      { title: "Article 5 — Annulation et report", text: "L'organisme peut reporter une session avec un délai minimum de 5 jours ouvrés. Le stagiaire peut annuler avec un délai de 10 jours ouvrés." },
      { title: "Article 6 — Obligations de l'organisme", text: "L'organisme fournit les informations contractuelles, réalise les formations avec diligence, et assure l'inscription aux examens." },
      { title: "Article 7 — Obligations des stagiaires", text: "Le stagiaire s'engage à participer à la formation, s'inscrire et se présenter à l'examen, respecter le règlement intérieur." },
      { title: "Article 8 — Comportement général", text: "Les stagiaires respectent les règles de bonne conduite et le matériel mis à disposition." },
      { title: "Article 9 — Procédures contradictoires", text: "En cas de réclamation, le stagiaire adresse sa réclamation à l'organisme. Les parties recherchent un accord amiable." },
      { title: "Article 10 — Propriété intellectuelle", text: "L'organisme est titulaire des droits de propriété intellectuelle afférents aux supports de formation. Le stagiaire n'en fait qu'un usage personnel." },
      { title: "Article 11 — Modification", text: "L'organisme pourra modifier les CGU. Les CGU applicables sont celles en vigueur à la date de remise au stagiaire." },
      { title: "Article 12 — Droit applicable", text: "Les présentes CGU sont régies par le droit français." },
    ];

    cguArticles.forEach(a => {
      y = checkNewPage(doc, y, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(a.title, 20, y);
      y += 4;
      y = addParagraph(doc, a.text, y, { fontSize: 8 });
      y += 2;
    });
  });

  // ======================== PAGES 14-16: CGV (nouvelles) ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Conditions Générales de Vente (CGV)", 42);
    y += 4;

    const cgvArticles = [
      { title: "Article 0 — Définitions", text: "Mission : Toute opération réalisée par Drones37 au moyen d'un drone. Formation : Action de formation théorique et/ou pratique à destination de télépilotes de drones. Devis : Document contractuel décrivant la prestation. Client : Toute personne commandant une Mission ou une Formation." },
      { title: "Article 1 — Objet et champ d'application", text: "Les présentes CGV définissent les droits et obligations de Drones37 et de ses Clients. L'acceptation du Devis vaut adhésion pleine aux présentes CGV." },
      { title: "Article 2 — Cadre réglementaire et sécurité", text: "Drones37 s'engage à respecter les réglementations applicables à l'utilisation des aéronefs sans équipage. Le télépilote demeure seul juge de la faisabilité." },
      { title: "Article 3 — Formation du contrat", text: "Tout Devis constitue une offre ferme. L'acceptation doit être formalisée par écrit. Toute modification fera l'objet d'un Devis complémentaire." },
      { title: "Article 4 — Prix et modalités de paiement", text: "Les prix figurent au Devis. Un acompte de 30% peut être exigé. Le solde est payable au plus tard à la fin de prestation. La livraison des Données est subordonnée au paiement intégral." },
      { title: "Article 5 — Exécution des Missions", text: "Drones37 est tenue à une obligation de moyens. Elle conserve la maîtrise de l'organisation technique." },
      { title: "Article 6 — Météo, autorisations et report", text: "Drones37 peut reporter une Mission si les conditions ne le permettent pas. Le Client obtient les autorisations d'accès aux sites." },
      { title: "Article 7 — Traitements / pulvérisation", text: "Les traitements visent à assainir et limiter la repousse. Les effets peuvent être progressifs. Les produits sont choisis par Drones37." },
      { title: "Article 8 — Inspections techniques", text: "L'inspection constitue un constat visuel non destructif. Elle ne remplace pas une expertise structurelle." },
      { title: "Article 9 — Photo/vidéo & post-production", text: "Le Client obtient les autorisations nécessaires. Un délai de 10 jours pour demander corrections." },
      { title: "Article 10 — Formation télépilote", text: "Les modalités figurent dans la convention. Le règlement est exigible avant le début. Les supports demeurent propriété de Drones37." },
      { title: "Article 11 — Données et propriété intellectuelle", text: "Les Données sont cédées pour l'usage spécifié au Devis. Les droits demeurent acquis à Drones37. Confidentialité engagée." },
      { title: "Article 12 — Conservation des Données", text: "Données conservées gratuitement 3 mois après paiement. Gestion conforme au RGPD." },
      { title: "Article 13 — Données personnelles (RGPD)", text: "Traitement pour l'exécution du contrat. Droits d'accès, rectification, effacement exerçables sur demande." },
      { title: "Article 14 — Responsabilité et assurances", text: "Drones37 est assurée en RC professionnelle. Responsabilité limitée aux dommages directs." },
      { title: "Article 15 — Sous-traitance", text: "Drones37 peut recourir à des sous-traitants en garantissant confidentialité et qualité." },
      { title: "Article 16 — Force majeure", text: "Pandémies, grèves, catastrophes naturelles, etc. Les obligations sont suspendues conformément à l'article 1218 du Code civil." },
      { title: "Article 17 — Dispositions consommateurs", text: "Le Client consommateur peut recourir à un médiateur. Droit de rétractation applicable selon les règles légales." },
      { title: "Article 18 — Loi applicable et litiges", text: "CGV régies par le droit français. Recherche de solution amiable avant action judiciaire." },
      { title: "Article 19 — Dispositions diverses", text: "Drones37 se réserve le droit de modifier les CGV. La nullité d'une clause n'affecte pas les autres." },
    ];

    cgvArticles.forEach(a => {
      y = checkNewPage(doc, y, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(a.title, 20, y);
      y += 4;
      y = addParagraph(doc, a.text, y, { fontSize: 8 });
      y += 2;
    });

    // Footer CGV
    y = checkNewPage(doc, y, 20);
    y += 4;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Drones37 — Stéphane PELARD", 20, y);
    y += 4;
    doc.text("19 rue Madeleine Vernet — 37270 Montlouis-sur-Loire — 06 51 11 27 02", 20, y);
    y += 4;
    doc.text("SIREN 497 986 604 — TVA FR65 497986604 — NDA Formation 24370471537", 20, y);
  });

  // ======================== PAGE: PROTECTION DES DONNÉES ========================
  pages.push(() => {
    addHeader(doc);
    let y = addSectionTitle(doc, "Protection des données personnelles", 42);
    y += 4;

    y = addParagraph(doc, "Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), DRONES37 s'engage à respecter la vie privée des stagiaires.", y);
    y += 4;

    const rgpdItems = [
      { title: "Données collectées", text: "Identité, coordonnées, parcours professionnel, données de formation." },
      { title: "Finalités", text: "Gestion administrative, suivi pédagogique, obligations légales, amélioration continue." },
      { title: "Base légale", text: "Exécution du contrat de formation, obligations légales (Code du travail), intérêt légitime." },
      { title: "Durée de conservation", text: "Les données sont conservées pendant la durée de la formation et 5 ans après la fin de la formation." },
      { title: "Droits des stagiaires", text: "Droit d'accès, de rectification, d'effacement, de limitation du traitement, d'opposition et de portabilité. Ces droits sont exerçables sur simple demande à contact@drones37.com." },
      { title: "Sécurité", text: "DRONES37 met en œuvre des mesures techniques et organisationnelles appropriées pour assurer la sécurité des données personnelles." },
      { title: "Réclamation", text: "En cas de difficulté, vous pouvez saisir la CNIL (Commission Nationale de l'Informatique et des Libertés)." },
    ];

    rgpdItems.forEach(item => {
      y = checkNewPage(doc, y, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(item.title, 20, y);
      y += 5;
      y = addParagraph(doc, item.text, y, { fontSize: 8 });
      y += 3;
    });

    // Contact DPO
    y = checkNewPage(doc, y, 20);
    y += 4;
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(15, y - 2, 180, 18, 3, 3, "F");
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Contact pour l'exercice de vos droits :", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`${COMPANY.owner} — ${COMPANY.email} — ${COMPANY.phone}`, 20, y);
  });

  // ==================== RENDER ALL PAGES ====================
  pages.forEach((renderPage, i) => {
    if (i > 0) doc.addPage();
    renderPage();
  });

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) { // Skip cover page
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  const fileName = `Livret_Accueil_${student.firstName}_${student.lastName}_${config.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
  return fileName;
}
