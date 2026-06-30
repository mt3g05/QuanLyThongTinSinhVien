const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ptit_student_management'
    });
    
    // Add 'Chờ xác nhận' to status enum
    await pool.query("ALTER TABLE tuitions MODIFY COLUMN status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Thanh toán một phần', 'Chờ xác nhận') DEFAULT 'Chưa thanh toán'");
    
    console.log("Database altered successfully!");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
