/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Alter users table role enum
  await knex.raw(`ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'student', 'instructor') NOT NULL;`);

  // Add user_id to instructors table
  const hasUserId = await knex.schema.hasColumn('instructors', 'user_id');
  if (!hasUserId) {
    await knex.schema.alterTable('instructors', (t) => {
      t.integer('user_id').unique().references('id').inTable('users').onDelete('SET NULL');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Revert user_id
  const hasUserId = await knex.schema.hasColumn('instructors', 'user_id');
  if (hasUserId) {
    await knex.schema.alterTable('instructors', (t) => {
      t.dropColumn('user_id');
    });
  }

  // Revert enum (Note: this will fail if there are any 'instructor' roles in DB)
  await knex.raw(`ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'student') NOT NULL;`);
};
