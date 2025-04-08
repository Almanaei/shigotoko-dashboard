-- Add authentication fields to Employee model
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
