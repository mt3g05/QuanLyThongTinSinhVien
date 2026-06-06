const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

async function test() {
  const students = [
    { student_code: 'SV01', attendance_score: 9, midterm_score: 8, final_score: 7, full_name: 'Name 1', class_code: 'Class 1' }
  ];
  const course = { course_code: 'C01' };

  const excelData = students.map((s) => ({
    "Mã Sinh viên": s.student_code,
    "Mã Môn học": course?.course_code || "",
    "Chuyên cần": s.attendance_score != null ? s.attendance_score : "",
    "Giữa kỳ": s.midterm_score != null ? s.midterm_score : "",
    "Cuối kỳ": s.final_score != null ? s.final_score : "",
    "Họ tên (Không sửa)": s.full_name,
    "Lớp (Không sửa)": s.class_code
  }));

  const worksheetOut = XLSX.utils.json_to_sheet(excelData);
  const workbookOut = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbookOut, worksheetOut, "BangDiem");
  const outBuffer = XLSX.write(workbookOut, { type: 'buffer', bookType: 'xlsx' });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(outBuffer);
  const worksheet = workbook.worksheets[0];

  const rows = [];
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

  console.log(rows);
}

test();
