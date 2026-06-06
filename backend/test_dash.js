require('dotenv').config({ path: '.env' });
const { queryOne, connectDatabase } = require('./src/config/database');

async function test() {
  await connectDatabase();
  try {
    const studentId = 2;
    const realStats = await queryOne(
      `SELECT 
         (SUM(max_gpa * credits) / NULLIF(SUM(credits), 0)) as avg_gpa, 
         SUM(CASE WHEN max_gpa > 0 THEN credits ELSE 0 END) as total_credits
       FROM (
         SELECT g.course_id, c.credits, MAX(g.gpa_score) as max_gpa
         FROM grades g
         LEFT JOIN courses c ON g.course_id = c.id
         WHERE g.student_id = ? AND g.status = 'Đã duyệt' AND g.gpa_score IS NOT NULL
         GROUP BY g.course_id, c.credits
       ) as best_grades`,
      [studentId]
    );
    console.log("Real stats:", realStats);
    
    const studentGpa = realStats?.avg_gpa ? parseFloat(realStats.avg_gpa).toFixed(2) : 0;
    console.log("Calculated GPA:", studentGpa);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
