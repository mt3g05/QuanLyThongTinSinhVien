const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/controllers/student/gradeController.js'),
  path.join(__dirname, 'src/controllers/student/dashboardController.js')
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Match the corrupted string which looks like '?A duyt' or similar
  // The easiest way is to match: g.status = '<anything>' AND g.gpa_score
  content = content.replace(/g\.status\s*=\s*'[^']+'\s*AND\s*g\.gpa_score/g, "g.status = 'Đã duyệt' AND g.gpa_score");
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
