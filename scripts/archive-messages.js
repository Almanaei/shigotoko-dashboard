/**
 * Message Archive Automation Script
 * 
 * This script can be run as a monthly cron job to automatically archive messages
 * and clear the current messages table.
 * 
 * Recommended cron schedule: 0 0 1 * * (At midnight on the 1st of every month)
 * 
 * Usage:
 *   - Manually: node scripts/archive-messages.js
 *   - Automated: Setup as a cron job or scheduled task
 */

const { PrismaClient } = require('@prisma/client');
const { format, subMonths } = require('date-fns');
const crypto = require('crypto');

// Initialize Prisma client
const prisma = new PrismaClient();

// Main archive function
async function archiveMessages() {
  console.log('Starting message archiving process...');
  
  try {
    // Get the previous month in YYYY-MM format
    const now = new Date();
    const previousMonth = subMonths(now, 1);
    const archiveMonth = format(previousMonth, 'yyyy-MM');
    
    console.log(`Archiving messages for month: ${archiveMonth}`);
    
    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch all current messages with related data
      const messages = await tx.message.findMany({
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              avatar: true,
            }
          },
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            }
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });
      
      console.log(`Found ${messages.length} messages to archive`);
      
      if (messages.length === 0) {
        return {
          archived: 0,
          deleted: 0,
          month: archiveMonth
        };
      }
      
      let archivedCount = 0;
      
      // 2. Copy messages to archive table
      for (const message of messages) {
        const senderInfo = message.employee || message.sender;
        const uuid = crypto.randomUUID();
        
        try {
          // Use raw query for better compatibility
          await tx.$executeRaw`
            INSERT INTO "MessageArchive" (
              "id", "content", "senderId", "employeeId", "senderName", 
              "senderAvatar", "timestamp", "archiveMonth", "isEmployee", "createdAt"
            ) VALUES (
              ${uuid}, 
              ${message.content},
              ${message.senderId || null},
              ${message.employeeId || null},
              ${senderInfo ? senderInfo.name : (message.senderName || 'Unknown User')},
              ${senderInfo?.avatar || null},
              ${message.timestamp},
              ${archiveMonth},
              ${!!message.employeeId},
              ${new Date()}
            )
          `;
          
          archivedCount++;
        } catch (error) {
          console.error('Error archiving message:', error);
          throw error; // Re-throw to trigger transaction rollback
        }
      }
      
      // 3. Delete archived messages from current table
      const deleted = await tx.message.deleteMany({});
      
      // 4. Create a system message to inform users
      const systemMessage = await tx.message.create({
        data: {
          content: `Messages from ${format(previousMonth, 'MMMM yyyy')} have been archived. You can view them in the Archives tab.`,
          senderName: 'System',
          timestamp: new Date()
        }
      });
      
      return {
        archived: archivedCount,
        deleted: deleted.count,
        month: archiveMonth,
        systemMessage: systemMessage.id
      };
    });
    
    console.log('Archiving complete!');
    console.log(`Successfully archived ${result.archived} messages for ${archiveMonth}`);
    console.log(`Deleted ${result.deleted} messages from current messages table`);
    console.log(`Created system message with ID: ${result.systemMessage}`);
    
    return result;
  } catch (error) {
    console.error('Error during archive process:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  archiveMessages()
    .then(result => {
      console.log('Archive operation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Archive operation failed:', error);
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = { archiveMessages };
} 