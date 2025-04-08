# Migration: Add Authentication Fields to Employee

Created: 2025-04-08T01:47:54.100Z

## Description

Add authentication fields to Employee model

## Actions

- Add role column to Employee
- Add password column to Employee
- Create index for role-based queries
- Set role to admin for admin employees

## Rollback

To roll back this migration, run the following SQL:

```sql
-- Revert authentication fields from Employee model
ALTER TABLE "Employee" DROP COLUMN "role";
ALTER TABLE "Employee" DROP COLUMN "password";
DROP INDEX IF EXISTS "Employee_role_idx";

```