import { generateLivretAccueilPDF } from './src/lib/livretAccueilGenerator';
import type { Student } from './src/lib/store';

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
doc.save('/tmp/livret_test.pdf');
console.log('PDF saved to /tmp/livret_test.pdf');
