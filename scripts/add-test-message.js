// Script to manually add a test message to the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestMessage() {
  try {
    console.log('Connecting to database...');

    // Get the first employee to use as sender
    const employee = await prisma.employee.findFirst({
      where: {
        role: 'admin'
      }
    });

    if (!employee) {
      console.error('No admin employee found to associate with the message');
      return;
    }

    console.log(`Using employee as sender: ${employee.name} (${employee.id})`);

    // Create a test message
    const message = await prisma.message.create({
      data: {
        content: `Test message created at ${new Date().toISOString()}`,
        employeeId: employee.id,
        senderName: employee.name,
        timestamp: new Date()
      }
    });

    console.log('Successfully created test message:');
    console.log(message);

    // Verify the message was created by querying it
    const savedMessage = await prisma.message.findUnique({
      where: {
        id: message.id
      },
      include: {
        employee: true
      }
    });

    console.log('Retrieved message from database:');
    console.log(savedMessage);

  } catch (error) {
    console.error('Error creating test message:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addTestMessage()
  .then(() => console.log('Done'))
  .catch(error => console.error('Script execution error:', error)); 