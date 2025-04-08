// Script to find admin users in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAdminUsers() {
  try {
    console.log('Connecting to database...');
    
    // Find users with admin role (checking various possible formats)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'administrator', 'Admin', 'Administrator']
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    console.log(`\nFound admin users: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      // Convert to simple objects for better console display
      const displayUsers = adminUsers.map(user => ({
        ID: user.id.slice(0, 8) + '...',
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Department: user.department || 'N/A',
        Created: user.createdAt.toISOString().split('T')[0]
      }));
      
      // Display as simple array first
      displayUsers.forEach((user, index) => {
        console.log(`\nAdmin User ${index + 1}:`);
        console.log(`  ID: ${user.ID}`);
        console.log(`  Name: ${user.Name}`);
        console.log(`  Email: ${user.Email}`);
        console.log(`  Role: ${user.Role}`);
        console.log(`  Department: ${user.Department}`);
        console.log(`  Created: ${user.Created}`);
      });
      
      // Also try table format
      console.log('\nAdmin users (table format):');
      console.table(displayUsers);
    } else {
      console.log('No admin users found.');
      
      // Display all user roles to help identify admin users with different role names
      const allUsers = await prisma.user.findMany({
        select: {
          role: true,
        },
        distinct: ['role']
      });
      
      if (allUsers.length > 0) {
        console.log('\nAvailable user roles in the system:');
        console.log(allUsers.map(u => u.role).join(', '));
        
        // Find users by each role
        for (const roleObj of allUsers) {
          const role = roleObj.role;
          const usersWithRole = await prisma.user.findMany({
            where: { role },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          });
          
          console.log(`\nUsers with role "${role}" (${usersWithRole.length}):`);
          if (usersWithRole.length > 0) {
            // Display as simple list
            usersWithRole.forEach((user, index) => {
              console.log(`\nUser ${index + 1}:`);
              console.log(`  ID: ${user.id.slice(0, 8)}...`);
              console.log(`  Name: ${user.name}`);
              console.log(`  Email: ${user.email}`);
              console.log(`  Role: ${user.role}`);
            });
          }
        }
      } else {
        console.log('No users found in the database.');
      }
    }
  } catch (error) {
    console.error('Error finding admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAdminUsers(); 