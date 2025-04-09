-- DropIndex
DROP INDEX "Employee_role_idx";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "employeeId" TEXT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
