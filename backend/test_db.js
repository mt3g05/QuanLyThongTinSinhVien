require('dotenv').config({ path: '.env' });
const { query, connectDatabase } = require('./src/config/database');
const gradeService = require('./src/services/gradeService');
const ExcelJS = require('exceljs');

async function test() {
  await connectDatabase();
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BangDiem');
    
    // add headers
    worksheet.addRow(["Mã Sinh viên", "Mã Môn học", "Chuyên cần", "Giữa kỳ", "Cuối kỳ", "Họ tên (Không sửa)", "Lớp (Không sửa)"]);
    
    // add a row with NEW scores: 7, 7, 7
    worksheet.addRow(["B22DCCN001", "INT001", 7, 7, 7, "Nguyen Van A", "D22CQCN01-B"]);
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    const file = {
      buffer: buffer,
      originalname: 'test.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    // process import for HK2 (2024-2025)
    console.log("Processing import...");
    const result = await gradeService.processImport(file, null, null, null, null, "HK2 (2024-2025)");
    console.log("Import Result:", result);
    
    // Verify DB
    const rows = await query("SELECT student_id, course_id, attendance_score, midterm_score, final_score FROM grades WHERE semester = 'HK2 (2024-2025)' LIMIT 1;");
    console.log("DB Grades:", rows);
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
