import prisma from '@/lib/prisma';

/**
 * Notification service for creating notifications automatically based on system events
 */

export type NotificationType = 'message' | 'alert' | 'update';

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  title: string, 
  message: string, 
  type: NotificationType = 'update'
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        read: false,
      }
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationForUsers(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType = 'update'
) {
  try {
    const notifications = await Promise.all(
      userIds.map(userId => 
        createNotification(userId, title, message, type)
      )
    );
    
    return notifications.filter(Boolean);
  } catch (error) {
    console.error('Error creating notifications for multiple users:', error);
    return [];
  }
}

/**
 * Create a notification for all users with a specific role
 */
export async function createNotificationForRole(
  role: string,
  title: string,
  message: string,
  type: NotificationType = 'update'
) {
  try {
    // Find all users with the specified role
    const users = await prisma.user.findMany({
      where: { role },
      select: { id: true }
    });
    
    const userIds = users.map(user => user.id);
    return createNotificationForUsers(userIds, title, message, type);
  } catch (error) {
    console.error('Error creating notifications for role:', error);
    return [];
  }
}

/**
 * Create a notification for all users except the specified user
 */
export async function createNotificationForAllExcept(
  excludeUserId: string,
  title: string,
  message: string,
  type: NotificationType = 'update'
) {
  try {
    // Find all users except the excluded one
    const users = await prisma.user.findMany({
      where: { 
        id: { not: excludeUserId } 
      },
      select: { id: true }
    });
    
    const userIds = users.map(user => user.id);
    return createNotificationForUsers(userIds, title, message, type);
  } catch (error) {
    console.error('Error creating notifications for all except:', error);
    return [];
  }
}

/**
 * Create a new project notification for team members
 */
export async function notifyNewProject(
  projectId: string,
  projectName: string,
  creatorId: string,
  teamMemberIds: string[]
) {
  const title = "New Project Created";
  const message = `You have been added to the project: ${projectName}`;
  
  // Notify all team members except the creator
  const recipientIds = teamMemberIds.filter(id => id !== creatorId);
  
  return createNotificationForUsers(recipientIds, title, message, 'update');
}

/**
 * Notify users about a document being shared with them
 */
export async function notifyDocumentShared(
  documentId: string,
  documentName: string,
  sharedByUserId: string,
  sharedWithUserIds: string[]
) {
  const title = "Document Shared With You";
  const message = `A document "${documentName}" has been shared with you`;
  
  return createNotificationForUsers(sharedWithUserIds, title, message, 'message');
}

/**
 * Notify about a new document upload
 */
export async function notifyDocumentUploaded(
  documentId: string,
  documentName: string,
  uploaderId: string,
  projectId?: string
) {
  const title = "New Document Uploaded";
  const message = `A new document "${documentName}"${projectId ? ' has been added to a project' : ' has been uploaded'}`;
  
  // If it's part of a project, notify project members
  if (projectId) {
    try {
      // Get the project members through the ProjectsOnEmployees relation
      const projectMembers = await prisma.projectsOnEmployees.findMany({
        where: { projectId },
        select: { employeeId: true }
      });
      
      if (projectMembers && projectMembers.length > 0) {
        // Notify all team members except the uploader
        const teamMemberIds = projectMembers
          .map(member => member.employeeId)
          .filter(id => id !== uploaderId);
        
        if (teamMemberIds.length > 0) {
          return createNotificationForUsers(teamMemberIds, title, message, 'update');
        }
      }
    } catch (error) {
      console.error('Error notifying about document upload for project:', error);
    }
  }
  
  // If no project or there was an error, notify admins
  return createNotificationForRole('Admin', title, message, 'update');
}

/**
 * Notify about a new employee being added
 */
export async function notifyNewEmployee(
  employeeId: string,
  employeeName: string,
  creatorId: string
) {
  const title = "New Employee Added";
  const message = `A new employee ${employeeName} has joined the team`;
  
  // Notify all admins except the creator
  return createNotificationForRole('Admin', title, message, 'alert');
}

/**
 * Notify about task assignment
 */
export async function notifyTaskAssigned(
  taskId: string,
  taskTitle: string,
  assigneeId: string,
  assignerId: string
) {
  const title = "New Task Assigned";
  const message = `You have been assigned a new task: ${taskTitle}`;
  
  // Only notify the assignee
  return createNotification(assigneeId, title, message, 'alert');
}

/**
 * Notify about upcoming task deadline (for tasks due in 24 hours)
 */
export async function notifyTaskDueSoon(
  taskId: string,
  taskTitle: string,
  assigneeId: string
) {
  const title = "Task Due Soon";
  const message = `Your task "${taskTitle}" is due in 24 hours`;
  
  return createNotification(assigneeId, title, message, 'alert');
}

/**
 * Notify about system update or maintenance
 */
export async function notifySystemUpdate(
  title: string,
  message: string
) {
  // Get all users
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const userIds = users.map(user => user.id);
    
    return createNotificationForUsers(userIds, title, message, 'update');
  } catch (error) {
    console.error('Error notifying about system update:', error);
    return [];
  }
} 