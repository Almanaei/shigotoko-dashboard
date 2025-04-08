// Script to generate migration SQL to add auth fields to Employee model
const fs = require('fs');
const path = require('path');

// Migration name with timestamp
const migrationName = `${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}_add_auth_to_employee`;
const migrationDir = path.join(__dirname, migrationName);

// Create migration SQL
const upSQL = `-- Add authentication fields to Employee model
ALTER TABLE "Employee" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE "Employee" ADD COLUMN "password" TEXT;

-- Create index for faster role-based queries
CREATE INDEX "Employee_role_idx" ON "Employee"("role");

-- Update existing admin employee with admin role
UPDATE "Employee" 
SET role = 'admin' 
WHERE position ILIKE '%admin%' OR position ILIKE '%Administrator%';

-- Comment to explain the migration
COMMENT ON COLUMN "Employee"."role" IS 'User role for authentication and permissions';
COMMENT ON COLUMN "Employee"."password" IS 'Hashed password for authentication';
`;

const downSQL = `-- Revert authentication fields from Employee model
ALTER TABLE "Employee" DROP COLUMN "role";
ALTER TABLE "Employee" DROP COLUMN "password";
DROP INDEX IF EXISTS "Employee_role_idx";
`;

// Create migration directory and files
async function createMigration() {
  try {
    // Create migration directory
    if (!fs.existsSync(migrationDir)){
      fs.mkdirSync(migrationDir);
      console.log(`Created migration directory: ${migrationName}`);
    }
    
    // Write migration files
    fs.writeFileSync(path.join(migrationDir, 'migration.sql'), upSQL);
    console.log('Created migration.sql with SQL to add auth fields');
    
    // Write migration info
    const migrationInfo = {
      description: 'Add authentication fields to Employee model',
      created_at: new Date().toISOString(),
      actions: [
        'Add role column to Employee',
        'Add password column to Employee',
        'Create index for role-based queries',
        'Set role to admin for admin employees'
      ]
    };
    
    fs.writeFileSync(
      path.join(migrationDir, 'README.md'), 
      `# Migration: Add Authentication Fields to Employee\n\n` +
      `Created: ${migrationInfo.created_at}\n\n` +
      `## Description\n\n` +
      `${migrationInfo.description}\n\n` +
      `## Actions\n\n` +
      migrationInfo.actions.map(a => `- ${a}`).join('\n') + 
      `\n\n## Rollback\n\n` +
      `To roll back this migration, run the following SQL:\n\n` +
      '```sql\n' + downSQL + '\n```'
    );
    console.log('Created README.md with migration documentation');
    
    console.log('\nMigration files created successfully!');
    console.log(`\nTo apply this migration, run: npx prisma migrate dev --name add_auth_to_employee`);
    console.log(`\nThis will add the necessary authentication fields to the Employee model.`);
    
  } catch (error) {
    console.error('Error creating migration:', error);
  }
}

createMigration(); 