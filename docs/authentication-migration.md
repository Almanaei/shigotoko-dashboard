# Authentication Migration Plan: From User to Employee Model

## Current Situation

The application currently uses two similar models:

1. **User Model**: Used for authentication and system access
   - Has `password` and `role` fields for authentication
   - Connected to `Session` model

2. **Employee Model**: Used for employee management
   - More comprehensive with fields like `position`, `departmentId`, `status`, etc.
   - Connected to `Department` model
   - No authentication capability (no password field)

## Migration Strategy

### 1. Schema Changes

- **Option A: Add Authentication Fields to Employee Model**
  ```prisma
  model Employee {
    // ... existing fields
    role       String    @default("employee") // Add role field
    password   String?   // Add password field
    sessions   Session[] // Add relation to sessions
  }
  ```

- **Option B: Create a Auth-Employee Relationship**
  ```prisma
  model User {
    id           String    @id @default(uuid())
    employeeId   String    @unique
    password     String    
    role         String
    sessions     Session[]
    employee     Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  }
  ```

### 2. Data Migration Steps

1. For each existing User, create or link an Employee record
2. Transfer authentication credentials to the chosen approach
3. Update session management to work with the new structure

### 3. API Updates

1. Update `/api/auth` endpoints to use Employee model (or Employee+User relationship)
2. Update authentication middleware to check for Employee permissions
3. Update frontend components to reflect Employee structure

### 4. Frontend Changes

1. Update login/register forms
2. Update user profile components
3. Update admin dashboards to use Employee model for user management

## Implementation Plan

### Phase 1: Schema Preparation

1. Update Prisma schema based on chosen approach
2. Run migration to apply schema changes
3. Create scripts to check and validate the changes

### Phase 2: Authentication Logic Update

1. Modify authentication routes
2. Update session management
3. Test login, registration, and session persistence

### Phase 3: Frontend Adaptation

1. Update UI components
2. Test user workflows
3. Document changes for developers

### Phase 4: Deprecation

1. Mark User model as deprecated
2. Add warnings in code for any direct use
3. Plan for eventual removal in future versions

## Recommended Approach

Based on the application structure, **Option A** (adding authentication fields to Employee) is recommended for simplicity and reducing duplication. This avoids maintaining two separate user-related tables and simplifies the data model.

## Migration Validation Checklist

- [ ] All users can log in with existing credentials
- [ ] Sessions persist correctly
- [ ] Role-based permissions work as expected
- [ ] Employee-specific features continue to work
- [ ] Admin can manage both authentication and employee data in one place

## Timeline

- Preparation and planning: 1 day
- Schema changes and migration: 1 day
- Logic updates: 2 days
- Testing and validation: 1 day
- Documentation: 1 day

Total estimated time: 6 days 