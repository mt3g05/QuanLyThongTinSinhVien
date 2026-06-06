/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasMajorId = await knex.schema.hasColumn('courses', 'major_id');
  if (!hasMajorId) {
    await knex.schema.alterTable('courses', (t) => {
      t.integer('major_id').references('id').inTable('majors').onDelete('SET NULL');
      t.integer('class_id').references('id').inTable('classes').onDelete('SET NULL');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasMajorId = await knex.schema.hasColumn('courses', 'major_id');
  if (hasMajorId) {
    await knex.schema.alterTable('courses', (t) => {
      t.dropColumn('major_id');
      t.dropColumn('class_id');
    });
  }
};
