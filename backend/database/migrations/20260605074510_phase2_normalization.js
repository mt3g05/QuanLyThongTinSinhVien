/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Add semester_id and foreign keys
  const tables = ['courses', 'grades', 'schedules', 'registrations', 'tuitions'];
  
  for (const table of tables) {
    const hasSemesterId = await knex.schema.hasColumn(table, 'semester_id');
    if (!hasSemesterId) {
      await knex.schema.alterTable(table, (t) => {
        t.integer('semester_id').references('id').inTable('semesters').onDelete('SET NULL');
      });
      
      // Update data: assume semester text matches semesters.code or semesters.name
      // For a real prod system we'd do a mapping, but here we can try to map by exact match
      await knex.raw(`
        UPDATE ?? t
        JOIN semesters s ON t.semester = s.code OR t.semester = s.name
        SET t.semester_id = s.id
      `, [table]);
    }
  }

  // Note: We don't drop the 'semester' varchar column yet to avoid completely breaking the API
  // until we refactor the Backend code. We will drop it in Phase 3 or later if needed, 
  // or after updating backend code. For now, we add semester_id.

  // 2. Add UNIQUE constraints to students (email, id_number)
  // We must ensure there are no duplicates before adding UNIQUE, 
  // but for a clean DB or assuming data is mostly clean:
  const hasEmailUnique = await knex.raw(`
    SELECT COUNT(1) as count FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE table_schema = DATABASE() AND table_name = 'students' AND index_name = 'students_email_unique'
  `);
  
  if (hasEmailUnique[0][0].count === 0) {
    // Only add if not exists, we use raw to gracefully handle existing duplicates if we want,
    // but knex alterTable is better:
    try {
      await knex.schema.alterTable('students', t => {
        t.unique('email');
      });
    } catch (e) {
      console.warn("Could not add unique constraint to email, there might be duplicate emails.");
    }
    
    try {
      await knex.schema.alterTable('students', t => {
        t.unique('id_number');
      });
    } catch (e) {
      console.warn("Could not add unique constraint to id_number, there might be duplicates.");
    }
  }

  // 3. Create Triggers for derived data
  
  // 3.1 Trigger: Update total_students in classes when student class_id changes
  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS after_student_insert
    AFTER INSERT ON students
    FOR EACH ROW
    BEGIN
      IF NEW.class_id IS NOT NULL THEN
        UPDATE classes SET total_students = total_students + 1 WHERE id = NEW.class_id;
      END IF;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS after_student_update
    AFTER UPDATE ON students
    FOR EACH ROW
    BEGIN
      IF OLD.class_id != NEW.class_id THEN
        IF OLD.class_id IS NOT NULL THEN
          UPDATE classes SET total_students = GREATEST(total_students - 1, 0) WHERE id = OLD.class_id;
        END IF;
        IF NEW.class_id IS NOT NULL THEN
          UPDATE classes SET total_students = total_students + 1 WHERE id = NEW.class_id;
        END IF;
      END IF;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS after_student_delete
    AFTER DELETE ON students
    FOR EACH ROW
    BEGIN
      IF OLD.class_id IS NOT NULL THEN
        UPDATE classes SET total_students = GREATEST(total_students - 1, 0) WHERE id = OLD.class_id;
      END IF;
    END;
  `);

  // 3.2 Trigger: Update GPA and credits when grade is approved or changed
  // We use Weighted Average for GPA: SUM(g.gpa_score * c.credits) / SUM(c.credits)
  await knex.raw(`
    CREATE PROCEDURE IF NOT EXISTS UpdateStudentGPA(IN studentId INT)
    BEGIN
      DECLARE new_gpa DECIMAL(3,2);
      DECLARE total_creds INT;
      
      SELECT SUM(g.gpa_score * c.credits) / NULLIF(SUM(c.credits), 0), SUM(c.credits)
      INTO new_gpa, total_creds
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      WHERE g.student_id = studentId AND g.status = 'Đã duyệt' AND g.gpa_score > 0;
      
      UPDATE students 
      SET gpa = IFNULL(new_gpa, 0), total_credits = IFNULL(total_creds, 0)
      WHERE id = studentId;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS after_grade_insert
    AFTER INSERT ON grades
    FOR EACH ROW
    BEGIN
      IF NEW.status = 'Đã duyệt' THEN
        CALL UpdateStudentGPA(NEW.student_id);
      END IF;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS after_grade_update
    AFTER UPDATE ON grades
    FOR EACH ROW
    BEGIN
      IF OLD.status != NEW.status OR OLD.gpa_score != NEW.gpa_score THEN
        CALL UpdateStudentGPA(NEW.student_id);
      END IF;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS after_grade_delete
    AFTER DELETE ON grades
    FOR EACH ROW
    BEGIN
      IF OLD.status = 'Đã duyệt' THEN
        CALL UpdateStudentGPA(OLD.student_id);
      END IF;
    END;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS after_student_insert');
  await knex.raw('DROP TRIGGER IF EXISTS after_student_update');
  await knex.raw('DROP TRIGGER IF EXISTS after_student_delete');
  
  await knex.raw('DROP TRIGGER IF EXISTS after_grade_insert');
  await knex.raw('DROP TRIGGER IF EXISTS after_grade_update');
  await knex.raw('DROP TRIGGER IF EXISTS after_grade_delete');
  await knex.raw('DROP PROCEDURE IF EXISTS UpdateStudentGPA');

  // Drop unique constraints
  try {
    await knex.schema.alterTable('students', t => {
      t.dropUnique('email');
      t.dropUnique('id_number');
    });
  } catch (e) {}

  // Drop semester_id columns
  const tables = ['courses', 'grades', 'schedules', 'registrations', 'tuitions'];
  for (const table of tables) {
    const hasSemesterId = await knex.schema.hasColumn(table, 'semester_id');
    if (hasSemesterId) {
      await knex.schema.alterTable(table, (t) => {
        t.dropColumn('semester_id');
      });
    }
  }
};
