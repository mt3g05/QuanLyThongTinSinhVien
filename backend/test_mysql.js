const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', database: 'ptit_student_management' });
  const [rows] = await pool.query('SELECT GREATEST(0, -1) as val');
  console.log('Result:', rows);
  process.exit(0);
}
test();
