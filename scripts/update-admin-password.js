// Script to update the admin employee with a password field
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('Connecting to database...');
    
    // Check if the employee exists
    const adminEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { position: { contains: 'admin', mode: 'insensitive' } },
          { position: { contains: 'Administrator', mode: 'insensitive' } }
        ]
      },
      include: {
        department: true
      }
    });
    
    if (!adminEmployee) {
      console.log('No admin employee found in the database.');
      return;
    }
    
    console.log(`Found admin employee: ${adminEmployee.name} (${adminEmployee.position})`);
    
    // Get the existing user with matching email if present
    const matchingUser = await prisma.user.findFirst({
      where: {
        email: adminEmployee.email
      }
    });
    
    // Password to assign (use the existing user's password if available)
    const passwordToAssign = matchingUser?.password || 'admin123';
    
    // Update employee with password and admin role
    const updatedEmployee = await prisma.$executeRaw`
      UPDATE "Employee" 
      SET password = ${passwordToAssign},
          role = 'admin'
      WHERE id = ${adminEmployee.id}
    `;
    
    console.log(`\nSuccessfully updated admin employee with password.`);
    
    // Verify the update
    const verifiedEmployee = await prisma.employee.findUnique({
      where: { id: adminEmployee.id },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        password: true,
        role: true
      }
    });
    
    if (verifiedEmployee && verifiedEmployee.password) {
      console.log('\nEmployee auth credentials are now set up:');
      console.log(`  ID: ${verifiedEmployee.id.slice(0, 8)}...`);
      console.log(`  Name: ${verifiedEmployee.name}`);
      console.log(`  Email: ${verifiedEmployee.email}`);
      console.log(`  Position: ${verifiedEmployee.position}`);
      console.log(`  Role: ${verifiedEmployee.role}`);
      console.log(`  Password: ${'*'.repeat(passwordToAssign.length)} (${passwordToAssign.length} characters)`);
      
      console.log('\nYou can now use these credentials to login via the employee auth endpoint:');
      console.log(`  Email: ${verifiedEmployee.email}`);
      console.log(`  Password: ${passwordToAssign}`);
      
      console.log('\nNOTE: This is a development setup. Always use secure passwords in production!');
    } else {
      console.log('\nFailed to verify the updated employee. Password may not have been set correctly.');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 