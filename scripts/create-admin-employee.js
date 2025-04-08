// Script to create a department and an admin employee
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminEmployee() {
  try {
    console.log('Connecting to database...');
    
    // Step 1: Create a Management/Admin department if it doesn't exist
    let adminDepartment;
    const existingDept = await prisma.department.findFirst({
      where: {
        name: { equals: 'Management', mode: 'insensitive' }
      }
    });
    
    if (existingDept) {
      console.log(`\nExisting Management department found: ${existingDept.name} (ID: ${existingDept.id.slice(0, 8)}...)`);
      adminDepartment = existingDept;
    } else {
      adminDepartment = await prisma.department.create({
        data: {
          name: 'Management',
          description: 'Administrative department for company management',
          color: '#3B82F6' // Blue color
        }
      });
      console.log(`\nCreated new Management department (ID: ${adminDepartment.id.slice(0, 8)}...)`);
    }
    
    // Step 2: Check if we already have an admin employee
    const adminEmployee = await prisma.employee.findFirst({
      where: {
        position: { contains: 'Admin', mode: 'insensitive' },
        departmentId: adminDepartment.id
      },
      include: {
        department: true
      }
    });
    
    if (adminEmployee) {
      console.log('\nExisting admin employee found:');
      console.log(`  ID: ${adminEmployee.id.slice(0, 8)}...`);
      console.log(`  Name: ${adminEmployee.name}`);
      console.log(`  Position: ${adminEmployee.position}`);
      console.log(`  Department: ${adminEmployee.department.name}`);
      console.log(`  Email: ${adminEmployee.email}`);
      console.log(`  Status: ${adminEmployee.status}`);
      console.log('\nNo need to create a new admin employee.');
    } else {
      // Add password field to employees (we'll use the email as a credential)
      console.log('\nCreating a new admin employee...');
      
      const newAdmin = await prisma.employee.create({
        data: {
          name: 'Admin User',
          position: 'System Administrator',
          email: 'admin@shigotoko.com',
          phone: '+1234567890', // Placeholder phone number
          status: 'active',
          departmentId: adminDepartment.id,
          joinDate: new Date(),
          performance: 100, // Top performance for admin
          // NOTE: In a real authentication system, we'd store auth credentials
          // either as a one-to-one relation with User or by adding a password field
        },
        include: {
          department: true
        }
      });
      
      console.log('\nAdmin employee created successfully:');
      console.log(`  ID: ${newAdmin.id.slice(0, 8)}...`);
      console.log(`  Name: ${newAdmin.name}`);
      console.log(`  Position: ${newAdmin.position}`);
      console.log(`  Department: ${newAdmin.department.name}`);
      console.log(`  Email: ${newAdmin.email}`);
      console.log(`  Status: ${newAdmin.status}`);
      console.log(`  Join Date: ${newAdmin.joinDate.toISOString().split('T')[0]}`);
      
      console.log('\nNOTE: For authentication, we would need to:');
      console.log('1. Either add a password field to the Employee model');
      console.log('2. Or create a one-to-one relationship with the User model');
      console.log('3. Or modify the auth system to use Employee instead of User');
    }
    
    // Step 3: Show all departments and employees for verification
    const departments = await prisma.department.findMany({
      include: {
        employees: true
      }
    });
    
    console.log('\nAll departments and their employees:');
    if (departments.length > 0) {
      departments.forEach((dept, deptIndex) => {
        console.log(`\nDepartment ${deptIndex + 1}: ${dept.name}`);
        console.log(`  ID: ${dept.id.slice(0, 8)}...`);
        console.log(`  Description: ${dept.description || 'N/A'}`);
        console.log(`  Employee Count: ${dept.employees.length}`);
        
        if (dept.employees.length > 0) {
          console.log('  Employees:');
          dept.employees.forEach((emp, empIndex) => {
            console.log(`    ${empIndex + 1}. ${emp.name} (${emp.position})`);
          });
        }
      });
    } else {
      console.log('No departments found in the database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminEmployee(); 