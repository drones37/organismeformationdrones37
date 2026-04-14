// Modules d'évaluation spécifiques à chaque type de formation DRONES37

export type FormationType = 
  | "Télépilote Drone STS-01/STS-02"
  | "Pulvérisation sur bâtiments par drone"
  | "Catégorie ouverte A1/A3";

export const FORMATION_TYPES: FormationType[] = [
  "Télépilote Drone STS-01/STS-02",
  "Pulvérisation sur bâtiments par drone",
  "Catégorie ouverte A1/A3",
];

export interface EvaluationItem {
  name: string;
}

export interface FormationModuleConfig {
  formationType: FormationType;
  evaluationItems: EvaluationItem[];
}

// Items d'évaluation extraits des vrais livrets DRONES37

const STS_ITEMS: EvaluationItem[] = [
  { name: "Connaître la réglementation européenne et française UAS" },
  { name: "Connaître les catégories d'exploitation (Ouverte, Spécifique, Certifiée)" },
  { name: "Créer et actualiser un MANEX" },
  { name: "Déclarer une activité d'exploitant UAS auprès des autorités" },
  { name: "Intégrer un UAS auprès d'un exploitant" },
  { name: "Préparer un vol Mission en STS-01" },
  { name: "Préparer un vol Mission en STS-02" },
  { name: "Lire et interpréter les cartes aéronautiques (OACI, NOTAM, SUP AIP)" },
  { name: "Effectuer les déclarations sur AlphaTango / DGAC" },
  { name: "Télépiloter un UAS avec assistance GPS" },
  { name: "Télépiloter un UAS en mode ATTI (sans GPS)" },
  { name: "Télépiloter un UAS en vol à vue (VLOS)" },
  { name: "Télépiloter un UAS hors vue (BVLOS) avec observateur" },
  { name: "Télépiloter un UAS en Situations dégradées" },
  { name: "Appliquer des procédures d'urgences adaptées à la mission et l'UAS" },
  { name: "Gérer les situations anormales (perte GPS, FlyAway, intrusion)" },
  { name: "Analyser des risques et déclarer un incident (CRESUS)" },
  { name: "Entretenir un UAS" },
];

const PULVERISATION_ITEMS: EvaluationItem[] = [
  { name: "Créer et actualiser un MANEX" },
  { name: "Déclarer une activité d'exploitant UAS auprès des autorités" },
  { name: "Intégrer un UAS auprès d'un exploitant" },
  { name: "Connaissances Protection individuelle" },
  { name: "Connaissance des produits et leurs utilisations" },
  { name: "Connaissance du lexique BTP" },
  { name: "Préparer un vol Mission en catégorie SPECIFIC - S3 - STS-01" },
  { name: "Réaliser un métrage" },
  { name: "Connaissances du matériel de pulvérisation" },
  { name: "Télépiloter un UAS avec assistance GPS" },
  { name: "Télépiloter un UAS en mode ATTI" },
  { name: "Télépiloter un UAS en Situations dégradées" },
  { name: "Appliquer des procédures d'urgences adaptées à la mission et l'UAS en cas de situation anormale" },
  { name: "Connaître le bon déroulement d'une prestation" },
  { name: "Analyser des risques et déclarer un incident (CRESUS)" },
  { name: "Réaliser des missions de pulvérisation par drone en conformité avec les attentes de l'exploitant et le cadre réglementaire" },
  { name: "Entretenir un UAS" },
];

const OPEN_A1A3_ITEMS: EvaluationItem[] = [
  { name: "Connaître la réglementation catégorie ouverte (A1, A2, A3)" },
  { name: "Connaître les classes d'UAS (C0, C1, C2, C3, C4)" },
  { name: "Connaître les limitations de masse et vitesse par sous-catégorie" },
  { name: "Connaître les règles de survol de tiers" },
  { name: "Connaître les obligations d'enregistrement exploitant et UAS" },
  { name: "Connaître les restrictions de zones de vol" },
  { name: "Effectuer l'enregistrement sur AlphaTango" },
  { name: "Préparer un vol en catégorie ouverte" },
  { name: "Télépiloter un UAS avec assistance GPS" },
  { name: "Télépiloter un UAS en mode ATTI" },
  { name: "Appliquer les règles de sécurité en vol" },
  { name: "Gérer les situations d'urgence" },
  { name: "QCM A1/A3 - BAPD AlphaTango" },
];

export interface FormationPrerequisites {
  theoriques: string[];
  obligations: string[];
  objectif: string;
}

export const FORMATION_PREREQUISITES: Record<FormationType, FormationPrerequisites> = {
  "Télépilote Drone STS-01/STS-02": {
    objectif: "Télépiloter un drone de moins de 25 kg",
    theoriques: ["Attestation A1/A3 (QCM en ligne)", "CATS (Certificate for remote pilots of UAS in the Specific category)"],
    obligations: ["MANEX (Manuel d'exploitation)", "Déclaration d'activité d'exploitant UAS", "Drone de classe C5 ou C6"],
  },
  "Pulvérisation sur bâtiments par drone": {
    objectif: "Télépiloter un drone pour la pulvérisation sur tous types de bâtiments",
    theoriques: ["Attestation A1/A3 (QCM en ligne)", "CATS obligatoire"],
    obligations: ["Autorisations spécifiques", "Cadre réglementaire pulvérisation"],
  },
  "Catégorie ouverte A1/A3": {
    objectif: "Télépiloter un drone de moins de 900 g",
    theoriques: ["Attestation A1/A3 (QCM en ligne via DGAC)"],
    obligations: ["Enregistrement exploitant sur AlphaTango", "Respect des règles : 120 m max, vol à vue (VLOS)"],
  },
};

export const FORMATION_MODULES: Record<FormationType, EvaluationItem[]> = {
  "Télépilote Drone STS-01/STS-02": STS_ITEMS,
  "Pulvérisation sur bâtiments par drone": PULVERISATION_ITEMS,
  "Catégorie ouverte A1/A3": OPEN_A1A3_ITEMS,
};

export function getModulesForFormation(formation: string): EvaluationItem[] {
  if (formation in FORMATION_MODULES) {
    return FORMATION_MODULES[formation as FormationType];
  }
  const lower = formation.toLowerCase();
  if (lower.includes("sts") || lower.includes("télépilote")) return STS_ITEMS;
  if (lower.includes("pulvé") || lower.includes("bâtiment")) return PULVERISATION_ITEMS;
  if (lower.includes("a1") || lower.includes("a3") || lower.includes("ouverte")) return OPEN_A1A3_ITEMS;
  return STS_ITEMS;
}

export function getPrerequisitesForFormation(formation: string): FormationPrerequisites | null {
  if (formation in FORMATION_PREREQUISITES) {
    return FORMATION_PREREQUISITES[formation as FormationType];
  }
  const lower = formation.toLowerCase();
  if (lower.includes("sts") || lower.includes("télépilote")) return FORMATION_PREREQUISITES["Télépilote Drone STS-01/STS-02"];
  if (lower.includes("pulvé") || lower.includes("bâtiment")) return FORMATION_PREREQUISITES["Pulvérisation sur bâtiments par drone"];
  if (lower.includes("a1") || lower.includes("a3") || lower.includes("ouverte")) return FORMATION_PREREQUISITES["Catégorie ouverte A1/A3"];
  return FORMATION_PREREQUISITES["Télépilote Drone STS-01/STS-02"];
}
