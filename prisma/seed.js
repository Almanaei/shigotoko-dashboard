const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Create only one admin user
    console.log('Seeding admin user');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@shigotoko.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@shigotoko.com',
        password: 'password123', // In a real app, this would be hashed
        role: 'Admin',
        avatar: '/avatar-placeholder.png',
      },
    });
    
    console.log('Created admin user:', adminUser);
    
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
    
    const financeDept = await prisma.department.create({
      data: {
        name: 'Finance',
        description: 'Financial planning and accounting',
        color: '#ef4444', // red
      }
    });
    
    console.log('Departments created successfully');
    
    // Create employees
    console.log('Seeding employees');
    const johnEmployee = await prisma.employee.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        position: 'UI Designer',
        departmentId: designDept.id,
        phone: '+1 (555) 123-4567',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2023-01-15'),
        performance: 85
      },
    });
    
    const emilyEmployee = await prisma.employee.upsert({
      where: { email: 'emily@example.com' },
      update: {},
      create: {
        name: 'Emily Johnson',
        email: 'emily@example.com',
        password: 'password123',
        position: 'Frontend Developer',
        departmentId: engineeringDept.id,
        phone: '+1 (555) 234-5678',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2022-08-01'),
        performance: 92
      },
    });
    
    const michaelEmployee = await prisma.employee.upsert({
      where: { email: 'michael@example.com' },
      update: {},
      create: {
        name: 'Michael Smith',
        email: 'michael@example.com',
        password: 'password123',
        position: 'Marketing Specialist',
        departmentId: marketingDept.id,
        phone: '+1 (555) 345-6789',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2023-03-10'),
        performance: 78
      },
    });
    
    const jessicaEmployee = await prisma.employee.upsert({
      where: { email: 'jessica@example.com' },
      update: {},
      create: {
        name: 'Jessica Williams',
        email: 'jessica@example.com',
        password: 'password123',
        position: 'HR Manager',
        departmentId: hrDept.id,
        phone: '+1 (555) 456-7890',
        avatar: '/avatar-placeholder.png',
        status: 'on-leave',
        joinDate: new Date('2021-11-15'),
        performance: 90
      },
    });
    
    const davidEmployee = await prisma.employee.upsert({
      where: { email: 'david@example.com' },
      update: {},
      create: {
        name: 'David Brown',
        email: 'david@example.com',
        password: 'password123',
        position: 'Financial Analyst',
        departmentId: financeDept.id,
        phone: '+1 (555) 567-8901',
        avatar: '/avatar-placeholder.png',
        status: 'active',
        joinDate: new Date('2022-05-20'),
        performance: 83
      },
    });
    
    console.log(`Created ${[johnEmployee, emilyEmployee, michaelEmployee, jessicaEmployee, davidEmployee].length} employees`);
    
    // Update department employee counts
    const departments = [
      engineeringDept,
      designDept,
      marketingDept,
      hrDept,
      financeDept,
    ];

    for (const dept of departments) {
      const count = await prisma.employee.count({
        where: { departmentId: dept.id },
      });

      await prisma.department.update({
        where: { id: dept.id },
        data: { employeeCount: count },
      });
    }
    
    console.log('Employees created successfully');
    
    // Create projects
    const projects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'Website Redesign',
          description: 'Redesign the company website with modern UI/UX',
          status: 'in-progress',
          progress: 60,
          startDate: new Date('2023-01-10'),
          endDate: new Date('2023-05-30'),
          budget: 20000,
          client: 'Internal',
          priority: 'high',
        },
      }),
      prisma.project.create({
        data: {
          name: 'Mobile App Development',
          description: 'Develop a mobile app for our main product',
          status: 'planning',
          progress: 20,
          startDate: new Date('2023-03-01'),
          endDate: new Date('2023-08-15'),
          budget: 35000,
          client: 'Internal',
          priority: 'medium',
        },
      }),
      prisma.project.create({
        data: {
          name: 'Marketing Campaign',
          description: 'Q2 marketing campaign for product launch',
          status: 'completed',
          progress: 100,
          startDate: new Date('2023-02-01'),
          endDate: new Date('2023-04-15'),
          budget: 15000,
          client: 'Marketing',
          priority: 'medium',
        },
      }),
    ]);
    
    console.log(`Created ${projects.length} projects`);
    
    // Assign employees to projects
    await prisma.projectsOnEmployees.createMany({
      data: [
        { projectId: projects[0].id, employeeId: johnEmployee.id },
        { projectId: projects[0].id, employeeId: emilyEmployee.id },
        { projectId: projects[1].id, employeeId: johnEmployee.id },
        { projectId: projects[1].id, employeeId: michaelEmployee.id },
        { projectId: projects[2].id, employeeId: michaelEmployee.id },
        { projectId: projects[2].id, employeeId: jessicaEmployee.id },
      ],
    });
    
    console.log('Projects and assignments created successfully');
    
    // Create tasks
    await prisma.task.createMany({
      data: [
        {
          title: 'Design homepage mockup',
          description: 'Create a mockup for the new homepage design',
          status: 'completed',
          projectId: projects[0].id,
          priority: 'high'
        },
        {
          title: 'Implement responsive design',
          description: 'Make sure the website works on all devices',
          status: 'in-progress',
          projectId: projects[0].id,
          priority: 'medium'
        },
        {
          title: 'Setup project repository',
          description: 'Initialize git repository and project structure',
          status: 'completed',
          projectId: projects[1].id,
          priority: 'high'
        },
        {
          title: 'Define app requirements',
          description: 'Document all requirements for the mobile app',
          status: 'in-progress',
          projectId: projects[1].id,
          priority: 'high'
        },
        {
          title: 'Create social media content',
          description: 'Design and schedule social media posts',
          status: 'completed',
          projectId: projects[2].id,
          priority: 'medium'
        },
      ],
    });
    
    console.log('Tasks created successfully');
    
    // Create project logs
    await prisma.projectLog.createMany({
      data: [
        {
          projectId: projects[0].id,
          description: 'Project started',
          action: 'info',
          timestamp: new Date('2023-01-10'),
        },
        {
          projectId: projects[0].id,
          description: 'Design phase completed',
          action: 'success',
          timestamp: new Date('2023-02-15'),
        },
        {
          projectId: projects[1].id,
          description: 'Project planning initiated',
          action: 'info',
          timestamp: new Date('2023-03-01'),
        },
        {
          projectId: projects[2].id,
          description: 'Campaign launched',
          action: 'info',
          timestamp: new Date('2023-02-01'),
        },
        {
          projectId: projects[2].id,
          description: 'Campaign completed successfully',
          action: 'success',
          timestamp: new Date('2023-04-15'),
        },
      ],
    });
    
    console.log('Project logs created successfully');
    
    // Create messages
    await prisma.message.createMany({
      data: [
        {
          content: 'Hey team, how is the website redesign coming along?',
          senderId: adminUser.id,
          senderName: 'Admin User',
          timestamp: new Date('2023-03-15T09:30:00'),
        },
        {
          content: 'We\'re making good progress. Homepage is almost done!',
          senderName: 'John Doe',
          timestamp: new Date('2023-03-15T09:35:00'),
        },
        {
          content: 'Great! Looking forward to seeing it.',
          senderId: adminUser.id,
          senderName: 'Admin User',
          timestamp: new Date('2023-03-15T09:40:00'),
        },
        {
          content: 'When is our next team meeting?',
          senderName: 'Emily Johnson',
          timestamp: new Date('2023-03-16T10:15:00'),
        },
        {
          content: 'Tomorrow at 2pm in the main conference room.',
          senderId: adminUser.id,
          senderName: 'Admin User',
          timestamp: new Date('2023-03-16T10:20:00'),
        },
      ],
    });
    
    console.log('Messages created successfully');
    
    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: adminUser.id,
          title: 'New Project Assigned',
          message: 'You have been assigned to the Website Redesign project',
          type: 'assignment',
          read: true,
          createdAt: new Date('2023-01-10T10:00:00'),
        },
        {
          userId: adminUser.id,
          title: 'Meeting Reminder',
          message: 'Team meeting starts in 30 minutes',
          type: 'reminder',
          read: false,
          createdAt: new Date('2023-03-16T13:30:00'),
        },
        {
          userId: adminUser.id,
          title: 'Task Completed',
          message: 'Design homepage mockup has been completed',
          type: 'update',
          read: false,
          createdAt: new Date('2023-02-15T15:45:00'),
        },
        {
          userId: adminUser.id,
          title: 'New Message',
          message: 'You have a new message from Admin User',
          type: 'message',
          read: true,
          createdAt: new Date('2023-03-15T09:30:00'),
        },
      ],
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

main().catch((error) => {
  console.error('Error in seed script:', error);
  process.exit(1);
}); 