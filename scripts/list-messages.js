// Script to list all messages in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listMessages() {
  try {
    console.log('Connecting to database...');

    // Get all messages, ordered by timestamp
    const messages = await prisma.message.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        employee: true,
        sender: true
      }
    });

    console.log(`Found ${messages.length} messages in the database:`);
    
    if (messages.length === 0) {
      console.log('No messages found in the database.');
    } else {
      messages.forEach((message, index) => {
        const sender = message.employee 
          ? `${message.employee.name} (Employee)` 
          : message.sender 
            ? `${message.sender.name} (User)`
            : `${message.senderName} (Unknown)`;
            
        console.log(`------- Message ${index + 1} -------`);
        console.log(`ID: ${message.id}`);
        console.log(`Content: ${message.content}`);
        console.log(`Sender: ${sender}`);
        console.log(`Time: ${message.timestamp}`);
        console.log(`Created: ${message.createdAt}`);
        console.log('-----------------------------');
      });
    }

  } catch (error) {
    console.error('Error listing messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
listMessages()
  .then(() => console.log('Done'))
  .catch(error => console.error('Script execution error:', error)); 