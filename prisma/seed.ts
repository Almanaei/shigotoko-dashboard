import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Create departments first
    const engineeringDept = await prisma.department.create({
      data: {
        name: 'Engineering',
        description: 'Software Development and Engineering',
        color: '#3b82f6', // blue
      }
    });
    
    const marketingDept = await prisma.department.create({
      data: {
        name: 'Marketing',
        description: 'Marketing and Sales',
        color: '#10b981', // green
      }
    });
    
    const designDept = await prisma.department.create({
      data: {
        name: 'Design',
        description: 'UI/UX and Graphic Design',
        color: '#8b5cf6', // purple
      }
    });
    
    const hrDept = await prisma.department.create({
      data: {
        name: 'Human Resources',
        description: 'Personnel Management',
        color: '#f59e0b', // amber
      }
    });
    
    console.log('Departments created successfully');
    
    // Create employees
    const employee1 = await prisma.employee.create({
      data: {
        name: 'Sarah Chen',
        position: 'Senior Developer',
        email: 'sarah.chen@shigotoko.com',
        phone: '+1 (555) 123-4567',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2021-06-15'),
        performance: 90,
        departmentId: engineeringDept.id,
      }
    });
    
    const employee2 = await prisma.employee.create({
      data: {
        name: 'John Smith',
        position: 'Marketing Manager',
        email: 'john.smith@shigotoko.com',
        phone: '+1 (555) 234-5678',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2022-01-10'),
        performance: 85,
        departmentId: marketingDept.id,
      }
    });
    
    const employee3 = await prisma.employee.create({
      data: {
        name: 'Emma Watson',
        position: 'UI/UX Designer',
        email: 'emma.watson@shigotoko.com',
        phone: '+1 (555) 345-6789',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2022-03-22'),
        performance: 88,
        departmentId: designDept.id,
      }
    });
    
    const employee4 = await prisma.employee.create({
      data: {
        name: 'Michael Johnson',
        position: 'HR Specialist',
        email: 'michael.johnson@shigotoko.com',
        phone: '+1 (555) 456-7890',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2021-11-05'),
        performance: 82,
        departmentId: hrDept.id,
      }
    });
    
    const employee5 = await prisma.employee.create({
      data: {
        name: 'David Lee',
        position: 'Backend Developer',
        email: 'david.lee@shigotoko.com',
        phone: '+1 (555) 567-8901',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2022-02-15'),
        performance: 87,
        departmentId: engineeringDept.id,
      }
    });
    
    // Update department employee counts
    await prisma.department.update({
      where: { id: engineeringDept.id },
      data: { employeeCount: 2 }
    });
    
    await prisma.department.update({
      where: { id: marketingDept.id },
      data: { employeeCount: 1 }
    });
    
    await prisma.department.update({
      where: { id: designDept.id },
      data: { employeeCount: 1 }
    });
    
    await prisma.department.update({
      where: { id: hrDept.id },
      data: { employeeCount: 1 }
    });
    
    console.log('Employees created successfully');
    
    // Create a admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Alex Johnson',
        email: 'alex.johnson@shigotoko.com',
        avatar: '/avatar-placeholder.png',
        role: 'admin',
        department: 'Engineering',
      }
    });
    
    console.log('Admin user created successfully');
    
    // Create projects
    const project1 = await prisma.project.create({
      data: {
        name: 'Dashboard Redesign',
        description: 'Redesign of the company dashboard with new features',
        status: 'in-progress',
        progress: 60,
        startDate: new Date('2023-01-15'),
        endDate: new Date('2023-06-30'),
        budget: 25000,
        client: 'Internal',
        priority: 'high',
      }
    });
    
    const project2 = await prisma.project.create({
      data: {
        name: 'Marketing Campaign',
        description: 'Q2 marketing campaign for product launch',
        status: 'planning',
        progress: 20,
        startDate: new Date('2023-03-01'),
        endDate: new Date('2023-07-31'),
        budget: 15000,
        client: 'Internal',
        priority: 'medium',
      }
    });
    
    // Assign employees to projects
    await prisma.projectsOnEmployees.createMany({
      data: [
        {
          projectId: project1.id,
          employeeId: employee1.id,
          role: 'lead',
        },
        {
          projectId: project1.id,
          employeeId: employee3.id,
          role: 'member',
        },
        {
          projectId: project1.id,
          employeeId: employee5.id,
          role: 'member',
        },
        {
          projectId: project2.id,
          employeeId: employee2.id,
          role: 'lead',
        },
        {
          projectId: project2.id,
          employeeId: employee3.id,
          role: 'member',
        },
      ]
    });
    
    console.log('Projects and assignments created successfully');
    
    // Create tasks
    await prisma.task.createMany({
      data: [
        {
          title: 'Design dashboard wireframes',
          description: 'Create wireframes for the new dashboard UI',
          status: 'completed',
          priority: 'high',
          dueDate: new Date('2023-02-15'),
          projectId: project1.id,
          assigneeId: employee3.id,
        },
        {
          title: 'Implement frontend components',
          description: 'Develop React components based on approved designs',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date('2023-04-30'),
          projectId: project1.id,
          assigneeId: employee1.id,
        },
        {
          title: 'Setup backend API',
          description: 'Create API endpoints for the dashboard features',
          status: 'in-progress',
          priority: 'medium',
          dueDate: new Date('2023-05-15'),
          projectId: project1.id,
          assigneeId: employee5.id,
        },
        {
          title: 'Draft marketing plan',
          description: 'Create initial marketing plan for Q2 campaign',
          status: 'completed',
          priority: 'high',
          dueDate: new Date('2023-03-15'),
          projectId: project2.id,
          assigneeId: employee2.id,
        },
        {
          title: 'Design campaign assets',
          description: 'Create visual assets for the marketing campaign',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date('2023-04-30'),
          projectId: project2.id,
          assigneeId: employee3.id,
        },
      ]
    });
    
    console.log('Tasks created successfully');
    
    // Create project logs
    await prisma.projectLog.createMany({
      data: [
        {
          action: 'create',
          description: 'Project was created',
          projectId: project1.id,
          timestamp: new Date('2023-01-15'),
        },
        {
          action: 'update',
          description: 'Project progress updated to 30%',
          projectId: project1.id,
          timestamp: new Date('2023-02-20'),
        },
        {
          action: 'update',
          description: 'Project progress updated to 60%',
          projectId: project1.id,
          timestamp: new Date('2023-04-10'),
        },
        {
          action: 'create',
          description: 'Project was created',
          projectId: project2.id,
          timestamp: new Date('2023-03-01'),
        },
        {
          action: 'update',
          description: 'Project progress updated to 20%',
          projectId: project2.id,
          timestamp: new Date('2023-03-25'),
        },
      ]
    });
    
    console.log('Project logs created successfully');
    
    // Create messages
    await prisma.message.createMany({
      data: [
        {
          content: 'Welcome to the team chat! Feel free to ask any questions.',
          senderId: adminUser.id,
          senderName: adminUser.name,
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          content: 'Thanks! I need some help with the onboarding process.',
          employeeId: employee1.id,
          senderName: employee1.name,
          timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
        },
        {
          content: 'Sure, I can help with that. What specific part of the onboarding process do you need assistance with?',
          senderId: adminUser.id,
          senderName: adminUser.name,
          timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
        },
        {
          content: 'I just added some new design mockups to the shared folder. Can everyone take a look when you get a chance?',
          employeeId: employee3.id,
          senderName: employee3.name,
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        },
      ]
    });
    
    console.log('Messages created successfully');
    
    // Create notifications for the admin user
    await prisma.notification.createMany({
      data: [
        {
          title: 'New Task Assigned',
          message: 'You have been assigned a new task: Dashboard redesign',
          type: 'task',
          read: false,
          userId: adminUser.id,
        },
        {
          title: 'Project Update',
          message: 'Dashboard project is now 60% complete',
          type: 'project',
          read: true,
          userId: adminUser.id,
        },
        {
          title: 'Meeting Reminder',
          message: 'Team meeting in 30 minutes',
          type: 'reminder',
          read: false,
          userId: adminUser.id,
        },
        {
          title: 'System Update',
          message: 'System maintenance scheduled for tonight',
          type: 'system',
          read: false,
          userId: adminUser.id,
        },
      ]
    });
    
    console.log('Notifications created successfully');
    
    // Create stats
    await prisma.stats.create({
      data: {
        totalEmployees: 5,
        totalProjects: 2,
        totalTasks: 5,
        completedTasks: 2,
        ongoingProjects: 1,
        monthlyData: {
          tasks: {
            jan: 3,
            feb: 5,
            mar: 7,
            apr: 5,
            may: 0,
            jun: 0
          },
          projects: {
            jan: 1,
            feb: 1,
            mar: 2,
            apr: 2,
            may: 2,
            jun: 2
          },
          performance: {
            jan: 78,
            feb: 82,
            mar: 85,
            apr: 87,
            may: 0,
            jun: 0
          }
        }
      }
    });
    
    console.log('Stats created successfully');
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedEmployees() {
  try {
    const department = await prisma.department.findFirst({
      where: { name: 'Engineering' }
    });

    if (!department) {
      throw new Error('Department not found');
    }

    await prisma.employee.createMany({
      data: [
        {
          name: 'Sarah Johnson',
          position: 'Lead Developer',
          departmentId: department.id,
          email: 'sarah@example.com',
          phone: '+1 (555) 123-4567',
          avatar: '/avatar-placeholder.png',
          status: 'active',
          joinDate: new Date('2022-01-10'),
          performance: 90,
        },
        {
          name: 'Michael Brown',
          position: 'Frontend Developer',
          departmentId: department.id,
          email: 'michael@example.com',
          phone: '+1 (555) 987-6543',
          avatar: '/avatar-placeholder.png',
          status: 'active',
          joinDate: new Date('2022-03-15'),
          performance: 85,
        },
        {
          name: 'Emma Davis',
          position: 'Backend Developer',
          departmentId: department.id,
          email: 'emma@example.com',
          phone: '+1 (555) 456-7890',
          avatar: '/avatar-placeholder.png',
          status: 'on-leave',
          joinDate: new Date('2022-05-20'),
          performance: 88,
        },
        {
          name: 'David Wilson',
          position: 'QA Engineer',
          departmentId: department.id,
          email: 'david@example.com',
          phone: '+1 (555) 321-6547',
          avatar: '/avatar-placeholder.png',
          status: 'active',
          joinDate: new Date('2022-07-05'),
          performance: 82,
        },
      ],
      skipDuplicates: true,
    });

    console.log('Employees seeded successfully');
  } catch (error) {
    console.error('Error seeding employees:', error);
  }
}

export async function seedUsers() {
  try {
    // Create admin user
    await prisma.user.upsert({
      where: { email: 'alex@example.com' },
      create: {
        name: 'Alex Smith',
        email: 'alex@example.com',
        password: await hashPassword('password123'),
        role: 'Admin',
        avatar: '/avatar-placeholder.png',
      },
      update: {},
    });

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

main().catch((error) => {
  console.error('Error in seed script:', error);
  process.exit(1);
}); 