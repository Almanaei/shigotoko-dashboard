# Shigotoko Dashboard - Database Management Guide

This guide provides detailed information about managing the PostgreSQL database used in the Shigotoko Dashboard application.

## Table of Contents

- [Database Setup](#database-setup)
- [Schema Overview](#schema-overview)
- [Managing Data](#managing-data)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Database Setup

### Prerequisites

- PostgreSQL 14+ installed on your system
- Node.js 16+ and npm

### Initial Setup

1. **Configure Environment Variables**

   Create or update your `.env` file in the project root with the following database configuration:

   ```
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/shigotoko_db"
   ```

   Replace `username`, `password`, and database name as appropriate for your environment.

2. **Initialize the Database**

   ```bash
   # Create the database (if not already created)
   createdb shigotoko_db

   # Apply the Prisma schema to the database
   npx prisma db push

   # Generate Prisma client
   npx prisma generate
   ```

3. **Seed the Database**

   Populate the database with initial data:

   ```bash
   npm run seed
   ```

## Schema Overview

The Shigotoko Dashboard database includes the following main entities:

### Users

The `User` model represents application users with authentication information.

```prisma
model User {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String
  role      String    @default("user")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Employees

The `Employee` model represents company employees.

```prisma
model Employee {
  id          String    @id @default(cuid())
  name        String
  position    String
  email       String    @unique
  phone       String?
  avatar      String?
  status      String    @default("active")
  joinDate    DateTime  @default(now())
  performance Int       @default(50)
  department  Department @relation(fields: [departmentId], references: [id])
  departmentId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Departments

The `Department` model organizes employees by department.

```prisma
model Department {
  id           String    @id @default(cuid())
  name         String
  description  String?
  color        String?
  employees    Employee[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### Projects

The `Project` model represents work projects.

```prisma
model Project {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("ongoing")
  startDate   DateTime  @default(now())
  endDate     DateTime?
  tasks       Task[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Tasks

The `Task` model represents activities within projects.

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("pending")
  project     Project   @relation(fields: [projectId], references: [id])
  projectId   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Messages

The `Message` model represents chat messages.

```prisma
model Message {
  id        String    @id @default(cuid())
  content   String
  sender    String
  timestamp DateTime  @default(now())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

## Managing Data

### API Endpoints

The application provides RESTful API endpoints for managing data:

#### Employees

- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get a specific employee
- `POST /api/employees` - Create a new employee
- `PUT /api/employees/:id` - Update an employee
- `DELETE /api/employees/:id` - Delete an employee

#### Departments

- `GET /api/departments` - List all departments
- `GET /api/departments/:id` - Get a specific department
- `POST /api/departments` - Create a new department
- `PUT /api/departments/:id` - Update a department
- `DELETE /api/departments/:id` - Delete a department

#### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Using the API Client

The application includes a client-side API service for interacting with these endpoints:

```typescript
// Example: Fetching employees
import { API } from '@/lib/api';

// Get all employees
const employees = await API.employees.getAll();

// Get a specific employee
const employee = await API.employees.getById('employee_id');

// Create an employee
const newEmployee = await API.employees.create({
  name: 'John Doe',
  position: 'Developer',
  departmentId: 'department_id',
  email: 'john@example.com',
  phone: '123-456-7890',
  status: 'active',
  joinDate: new Date().toISOString(),
  performance: 75
});

// Update an employee
await API.employees.update('employee_id', {
  position: 'Senior Developer'
});

// Delete an employee
await API.employees.delete('employee_id');
```

## Common Operations

### Database Migrations

When you need to update the database schema:

1. **Update the Prisma schema** (`prisma/schema.prisma`)
2. **Generate a migration**:
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```
3. **Apply the migration**:
   ```bash
   npx prisma migrate deploy
   ```

### Database Reset

To reset the database and start fresh:

```bash
# Reset the database (caution: this deletes all data!)
npx prisma migrate reset

# Alternatively, to keep the schema but delete all data:
npx prisma db push --force-reset
```

### Viewing Data

Use Prisma Studio for a visual interface to view and edit your data:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555.

## Troubleshooting

### Common Issues

#### Database Connection Errors

If you encounter connection issues:

1. **Check PostgreSQL service**: Ensure PostgreSQL is running on your system
2. **Verify credentials**: Check the DATABASE_URL in your .env file
3. **Network issues**: Ensure there are no firewall rules blocking the connection

#### Prisma Client Generation Errors

If Prisma client fails to generate:

```bash
# Regenerate Prisma client
npx prisma generate

# If problems persist, try cleaning the node_modules and reinstalling
rm -rf node_modules
npm install
```

#### Data Consistency Issues

For referential integrity problems:

1. Use Prisma Studio to inspect related tables
2. Check for orphaned records using raw SQL queries
3. Consider implementing transactions for operations that modify multiple tables

## Best Practices

### Performance Optimization

1. **Indexing**: Add appropriate indexes to fields frequently used in filtering or sorting:
   ```prisma
   model Employee {
     // ...
     email     String   @unique
     name      String   @index
     // ...
   }
   ```

2. **Pagination**: Implement pagination for API endpoints that may return large datasets:
   ```typescript
   // Example API implementation
   const getEmployees = async (page = 1, limit = 10) => {
     const skip = (page - 1) * limit;
     return prisma.employee.findMany({
       skip,
       take: limit,
     });
   };
   ```

3. **Eager Loading**: Use Prisma's `include` to load related data in a single query:
   ```typescript
   const getEmployeeWithDepartment = async (id) => {
     return prisma.employee.findUnique({
       where: { id },
       include: { department: true }
     });
   };
   ```

### Data Security

1. **Input Validation**: Always validate user input before database operations
2. **Parameterized Queries**: Use Prisma's built-in query structure to prevent SQL injection
3. **Access Control**: Implement proper authorization checks before database operations
4. **Sensitive Data**: Avoid storing sensitive data in plain text (use encryption where appropriate)

### Backup Strategy

1. **Regular Backups**:
   ```bash
   pg_dump -U username -d shigotoko_db > backup_$(date +%Y%m%d).sql
   ```

2. **Automated Backups**: Set up a cron job for daily backups
3. **Backup Testing**: Periodically test restoring from backups

## Advanced Topics

### Custom Database Queries

For complex queries beyond Prisma's capabilities:

```typescript
import { prisma } from '@/lib/prisma';

const runComplexQuery = async () => {
  const result = await prisma.$queryRaw`
    SELECT e.name, d.name as department_name, COUNT(p.id) as project_count
    FROM "Employee" e
    JOIN "Department" d ON e."departmentId" = d.id
    LEFT JOIN "EmployeeProject" ep ON e.id = ep."employeeId"
    LEFT JOIN "Project" p ON ep."projectId" = p.id
    GROUP BY e.id, d.id
    ORDER BY project_count DESC
    LIMIT 10
  `;
  return result;
};
```

### Database Transactions

For operations that require multiple changes to maintain consistency:

```typescript
import { prisma } from '@/lib/prisma';

const transferEmployeeToDepartment = async (employeeId, newDepartmentId) => {
  return prisma.$transaction(async (tx) => {
    // Update the employee
    const employee = await tx.employee.update({
      where: { id: employeeId },
      data: { departmentId: newDepartmentId },
    });
    
    // Update department statistics
    await tx.department.update({
      where: { id: employee.departmentId },
      data: { employeeCount: { decrement: 1 } },
    });
    
    await tx.department.update({
      where: { id: newDepartmentId },
      data: { employeeCount: { increment: 1 } },
    });
    
    return employee;
  });
};
```

---

This guide should help you effectively manage the database for your Shigotoko Dashboard application. For further assistance, consult the [Prisma documentation](https://www.prisma.io/docs/) or contact the development team. 