const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../../..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Database migration completed successfully');
    console.log('Tables created: users, tasks, task_dependencies');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigration };