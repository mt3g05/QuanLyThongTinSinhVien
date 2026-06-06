const { query, insert } = require('../config/database');
const { calculateAverage, getLetterGrade } = require('../utils/helpers');
const ExcelJS = require('exceljs');

class GradeService {
  async processImport(file, department_id, cohort_id, major_id, class_id, semester) {
    if (!file) throw new Error('Vui lòng đính kèm file Excel hoặc CSV');

    let cQuery = 'SELECT id, student_code FROM students WHERE 1=1';
    let params = [];
    if (class_id) { cQuery += ' AND class_id = ?'; params.push(class_id); }
    else if (major_id) { cQuery += ' AND major_id = ?'; params.push(major_id); }
    else if (department_id) { cQuery += ' AND department_id = ?'; params.push(department_id); }
    else if (cohort_id) { cQuery += ' AND cohort_id = ?'; params.push(cohort_id); }

    const students = await query(cQuery, params);
    const studentMap = {};
    students.forEach(s => studentMap[s.student_code.toLowerCase()] = s.id);

    const courses = await query('SELECT id, course_code FROM courses');
    const courseMap = {};
    courses.forEach(c => courseMap[c.course_code.toLowerCase()] = c.id);

    const isCSV = file.originalname.toLowerCase().endsWith('.csv') || file.mimetype === 'text/csv';
    const rows = [];

    if (isCSV) {
      const text = file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); 
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      lines.slice(1).forEach((line, idx) => {
        const cells = line.split(',');
        rows.push({
          rowNumber: idx + 2,
          sCode: cells[0]?.trim(),
          cCode: cells[1]?.trim(),
          att: parseFloat(cells[2]),
          mid: parseFloat(cells[3]),
          fin: parseFloat(cells[4])
        });
      });
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('File Excel không có dữ liệu');

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          rows.push({
            rowNumber,
            sCode: row.getCell(1).value?.toString().trim(),
            cCode: row.getCell(2).value?.toString().trim(),
            att: parseFloat(row.getCell(3).value),
            mid: parseFloat(row.getCell(4).value),
            fin: parseFloat(row.getCell(5).value)
          });
        }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    let errors = [];
    const validRecords = [];

    for (const r of rows) {
      if (!r.sCode || !r.cCode) {
        errorCount++;
        continue;
      }
      const studentId = studentMap[r.sCode.toLowerCase()];
      const courseId = courseMap[r.cCode.toLowerCase()];

      if (!studentId || !courseId) {
        errorCount++;
        errors.push(`Dòng ${r.rowNumber}: Không tìm thấy SV (${r.sCode}) hoặc Môn học (${r.cCode})`);
        continue;
      }

      // [FIX BUG-009] Validate khoảng điểm hợp lệ 0-10
      const isValidScore = (val) => isNaN(val) || (val >= 0 && val <= 10);
      if (!isValidScore(r.mid) || !isValidScore(r.fin) || !isValidScore(r.att)) {
        errorCount++;
        errors.push(`Dòng ${r.rowNumber}: Điểm không hợp lệ (phải từ 0 đến 10). Giá trị: att=${r.att}, mid=${r.mid}, fin=${r.fin}`);
        continue;
      }

      let average_score = null;
      let letter_grade = null;
      let gpa_score = null;

      if (!isNaN(r.mid) && !isNaN(r.fin)) {
        average_score = calculateAverage(r.mid, r.fin);
        const gradeInfo = getLetterGrade(average_score);
        letter_grade = gradeInfo.letter;
        gpa_score = gradeInfo.gpa;
      }

      validRecords.push([
        studentId, courseId, semester, 
        isNaN(r.att) ? null : r.att, 
        isNaN(r.mid) ? null : r.mid, 
        isNaN(r.fin) ? null : r.fin, 
        average_score, letter_grade, gpa_score, 'Chờ duyệt'
      ]);
    }

    if (validRecords.length > 0) {
      const placeholders = validRecords.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatParams = validRecords.flat();
      
      try {
        await insert(
          `INSERT INTO grades (student_id, course_id, semester, attendance_score, midterm_score, final_score, average_score, letter_grade, gpa_score, status)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE 
           attendance_score=VALUES(attendance_score), midterm_score=VALUES(midterm_score), final_score=VALUES(final_score),
           average_score=VALUES(average_score), letter_grade=VALUES(letter_grade), gpa_score=VALUES(gpa_score), status='Chờ duyệt'`,
          flatParams
        );

        // [FIX BUG] Tự động đăng ký môn học cho các sinh viên được import
        const regRecords = validRecords.map(r => [r[0], r[1], r[2], 'Đã xác nhận']);
        const regPlaceholders = regRecords.map(() => '(?, ?, ?, ?)').join(', ');
        const regFlatParams = regRecords.flat();
        
        await insert(
          `INSERT IGNORE INTO registrations (student_id, course_id, semester, status) 
           VALUES ${regPlaceholders}`,
          regFlatParams
        );
        
        // Cập nhật lại sĩ số cho các môn học
        const uniqueCourseIds = [...new Set(validRecords.map(r => r[1]))];
        const placeholdersCourse = uniqueCourseIds.map(() => '?').join(',');
        await query(
          `UPDATE courses c 
           SET current_students = (SELECT COUNT(*) FROM registrations r WHERE r.course_id = c.id) 
           WHERE id IN (${placeholdersCourse})`,
          uniqueCourseIds
        );

        successCount = validRecords.length;
      } catch (err) {
        throw new Error('Lỗi khi lưu dữ liệu hàng loạt: ' + err.message);
      }
    }

    return { successCount, errorCount, errors };
  }
}

module.exports = new GradeService();
