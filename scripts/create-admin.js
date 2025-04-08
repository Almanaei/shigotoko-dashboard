// Script to create an admin user if none exists
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Connecting to database...');
    
    // Check if any users exist
    const userCount = await prisma.user.count();
    
    console.log(`Total users in database: ${userCount}`);
    
    // Check if an admin user already exists
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'administrator', 'Admin', 'Administrator']
        },
      },
    });
    
    console.log(`Admin users found: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\nExisting admin users:');
      console.table(adminUsers.map(user => ({
        ID: user.id.slice(0, 8) + '...',
        Name: user.name,
        Email: user.email,
        Role: user.role,
      })));
      
      console.log('\nNo need to create a new admin user.');
    } else {
      console.log('\nNo admin users found. Creating a new admin user...');
      
      // Create a new admin user
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@shigotoko.com',
          password: 'admin123', // In a real app, this would be hashed
          role: 'admin',
        },
      });
      
      console.log('\nAdmin user created successfully:');
      console.table([{
        ID: newAdmin.id.slice(0, 8) + '...',
        Name: newAdmin.name,
        Email: newAdmin.email,
        Role: newAdmin.role,
        Created: newAdmin.createdAt.toISOString(),
      }]);
      
      console.log('\nAdmin Credentials:');
      console.log('Email: admin@shigotoko.com');
      console.log('Password: admin123');
      console.log('\nNOTE: This is a development account. Please change the password in production.');
    }
    
    // Show all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true, 
        email: true,
        role: true,
        createdAt: true,
      },
    });
    
    console.log('\nAll users in database:');
    if (allUsers.length > 0) {
      console.table(allUsers.map(user => ({
        ID: user.id.slice(0, 8) + '...',
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Created: user.createdAt.toISOString().split('T')[0],
      })));
    } else {
      console.log('No users found in the database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 