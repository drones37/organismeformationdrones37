import { generateLivretAccueilPDF } from './src/lib/livretAccueilGenerator';
import type { Student } from './src/lib/store';
import { writeFileSync } from 'fs';

const student: Student = {
  id: 'test',
  firstName: 'Jean',
  lastName: 'Test',
  email: 'test@example.com',
  phone: '0600000000',
  formation: 'STS-01/STS-02',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  status: 'active',
  createdAt: new Date().toISOString(),
} as Student;

const doc = generateLivretAccueilPDF(student);
const buf = doc.output('arraybuffer');
writeFileSync('/tmp/livret_test.pdf', new Uint8Array(buf));
console.log('PDF saved to /tmp/livret_test.pdf');
