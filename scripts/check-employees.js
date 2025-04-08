// Script to examine the Employee table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmployees() {
  try {
    console.log('Connecting to database...');
    
    // Check employee count
    const employeeCount = await prisma.employee.count();
    console.log(`\nTotal employees in database: ${employeeCount}`);
    
    // Check if there are any admin employees (based on position)
    const adminEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { position: { contains: 'admin', mode: 'insensitive' } },
          { position: { contains: 'manager', mode: 'insensitive' } },
          { position: { contains: 'director', mode: 'insensitive' } }
        ]
      },
      include: {
        department: true
      }
    });
    
    console.log(`\nPotential admin employees found: ${adminEmployees.length}`);
    
    // Show all employees
    const allEmployees = await prisma.employee.findMany({
      include: {
        department: true
      }
    });
    
    console.log('\nAll employees in database:');
    if (allEmployees.length > 0) {
      // Convert to simple objects for better console display
      const displayEmployees = allEmployees.map(emp => ({
        ID: emp.id.slice(0, 8) + '...',
        Name: emp.name,
        Position: emp.position,
        Department: emp.department?.name || 'N/A',
        Email: emp.email,
        Status: emp.status,
        JoinDate: emp.joinDate.toISOString().split('T')[0]
      }));
      
      // Display as simple array
      displayEmployees.forEach((emp, index) => {
        console.log(`\nEmployee ${index + 1}:`);
        console.log(`  ID: ${emp.ID}`);
        console.log(`  Name: ${emp.Name}`);
        console.log(`  Position: ${emp.Position}`);
        console.log(`  Department: ${emp.Department}`);
        console.log(`  Email: ${emp.Email}`);
        console.log(`  Status: ${emp.Status}`);
        console.log(`  Join Date: ${emp.JoinDate}`);
      });
    } else {
      console.log('No employees found in the database.');
      
      // Show departments for reference
      const departments = await prisma.department.findMany();
      if (departments.length > 0) {
        console.log('\nAvailable departments:');
        departments.forEach((dept, index) => {
          console.log(`  ${index + 1}. ${dept.name} (ID: ${dept.id.slice(0, 8)}...)`);
        });
      } else {
        console.log('\nNo departments found in the database.');
      }
    }
    
    // Show differences between User and Employee schemas
    console.log('\nComparison between User and Employee schemas:');
    console.log('User fields: id, name, email, password, avatar, role, department, createdAt, updatedAt');
    console.log('Employee fields: id, name, position, departmentId, email, phone, avatar, status, joinDate, performance, createdAt, updatedAt');
    console.log('\nKey differences:');
    console.log('- User has "password" and "role" for authentication');
    console.log('- Employee has "position", "phone", "status", "joinDate", and "performance"');
    console.log('- Employee has a direct relation to department via departmentId');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees(); 