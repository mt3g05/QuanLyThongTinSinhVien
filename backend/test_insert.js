require('dotenv').config();
const { connectDatabase, insert } = require('./src/config/database');

async function test() {
  try {
    await connectDatabase();
    
    const instructor_code = 'TEST001';
    const full_name = 'Test Name';
    const email = '';
    const phone = '';
    const department_id = '';
    const academic_rank = undefined;
    const degree = 'GS.TS';
    const status = 'Đang dạy';

    const insertResult = await insert(
      `INSERT INTO instructors (
        instructor_code, full_name, email, phone,
        department_id, academic_rank, degree, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        instructor_code, full_name,
        email || `${instructor_code.toLowerCase()}@ptit.edu.vn`,
        phone || null,
        department_id || null,
        academic_rank || null,
        degree || 'Thạc sĩ',
        status || 'Đang dạy'
      ]
    );
    console.log('Insert success:', insertResult);
  } catch (error) {
    console.error('Insert error:', error);
  }
  process.exit();
}

test();
