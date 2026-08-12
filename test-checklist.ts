import fs from "fs";
import path from "path";
import jsPDF from "jspdf";

// Override jsPDF.save to write the PDF to disk in Node/Bun
(jsPDF.prototype as any).save = function (filename: string) {
  const out = (this as any).output("arraybuffer");
  const buf = Buffer.from(out);
  const filePath = path.join("/tmp", filename);
  fs.writeFileSync(filePath, buf);
  console.log("Saved:", filePath);
};

import { generateEntryChecklistPDF } from "/dev-server/src/lib/entryChecklistGenerator";

const sampleStudent = {
  id: "test-1",
  firstName: "Jean",
  lastName: "DUPONT",
  email: "jean.dupont@example.com",
  phone: "06 12 34 56 78",
  formation: "Télépilote Drone STS-01/STS-02",
  startDate: "2026-09-01",
  endDate: "2026-09-05",
  status: "a_venir" as const,
};

generateEntryChecklistPDF(sampleStudent);
