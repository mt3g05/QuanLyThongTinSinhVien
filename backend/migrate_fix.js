require('dotenv').config();
const { getPool, connectDatabase } = require('./src/config/database');

async function runMigration() {
  let pool;
  try {
    await connectDatabase();
    pool = getPool();
    
    console.log('Running migration to fix bugs...');

    // 1. Update users table role ENUM to include 'instructor'
    console.log('Updating users.role ENUM...');
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'student', 'instructor') NOT NULL");

    // 2. Add is_first_login to users table
    console.log('Adding is_first_login to users...');
    try {
      await pool.query("ALTER TABLE users ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column is_first_login already exists.');
      } else {
        throw e;
      }
    }

    // 3. Add user_id to instructors table
    console.log('Adding user_id to instructors...');
    try {
      await pool.query("ALTER TABLE instructors ADD COLUMN user_id INT");
      await pool.query("ALTER TABLE instructors ADD CONSTRAINT fk_instructors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column user_id already exists in instructors.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

runMigration();
