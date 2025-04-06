const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Create users
    const alexUser = await prisma.user.create({
      data: {
        name: 'Alex Johnson',
        email: 'alex@shigotoko.com',
        password: 'password123', // In a real app, this would be hashed
        avatar: '/avatars/alex.jpg',
        role: 'Admin',
        department: 'Engineering',
      },
    });

    const sarahUser = await prisma.user.create({
      data: {
        name: 'Sarah Chen',
        email: 'sarah@shigotoko.com',
        password: 'password123', // In a real app, this would be hashed
        avatar: '/avatars/sarah.jpg',
        role: 'Manager',
        department: 'Design',
      },
    });

    console.log('Created users:', { alexUser, sarahUser });
    
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
    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          name: 'John Smith',
          position: 'Senior Developer',
          departmentId: engineeringDept.id,
          email: 'john@shigotoko.com',
          phone: '123-456-7890',
          avatar: '/avatars/john.jpg',
          status: 'active',
          joinDate: new Date('2020-01-15'),
          performance: 85,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Emily Wang',
          position: 'UX Designer',
          departmentId: designDept.id,
          email: 'emily@shigotoko.com',
          phone: '123-456-7891',
          avatar: '/avatars/emily.jpg',
          status: 'active',
          joinDate: new Date('2021-03-10'),
          performance: 78,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Michael Johnson',
          position: 'Marketing Specialist',
          departmentId: marketingDept.id,
          email: 'michael@shigotoko.com',
          phone: '123-456-7892',
          avatar: '/avatars/michael.jpg',
          status: 'active',
          joinDate: new Date('2021-05-22'),
          performance: 72,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Jessica Davis',
          position: 'HR Manager',
          departmentId: hrDept.id,
          email: 'jessica@shigotoko.com',
          phone: '123-456-7893',
          avatar: '/avatars/jessica.jpg',
          status: 'active',
          joinDate: new Date('2019-11-05'),
          performance: 90,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'David Wilson',
          position: 'Financial Analyst',
          departmentId: financeDept.id,
          email: 'david@shigotoko.com',
          phone: '123-456-7894',
          avatar: '/avatars/david.jpg',
          status: 'active',
          joinDate: new Date('2020-08-15'),
          performance: 82,
        },
      }),
    ]);
    
    console.log(`Created ${employees.length} employees`);
    
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
        { projectId: projects[0].id, employeeId: employees[0].id },
        { projectId: projects[0].id, employeeId: employees[1].id },
        { projectId: projects[1].id, employeeId: employees[0].id },
        { projectId: projects[1].id, employeeId: employees[2].id },
        { projectId: projects[2].id, employeeId: employees[2].id },
        { projectId: projects[2].id, employeeId: employees[3].id },
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
        },
        {
          title: 'Implement responsive design',
          description: 'Make sure the website works on all devices',
          status: 'in-progress',
          projectId: projects[0].id,
        },
        {
          title: 'Setup project repository',
          description: 'Initialize git repository and project structure',
          status: 'completed',
          projectId: projects[1].id,
        },
        {
          title: 'Define app requirements',
          description: 'Document all requirements for the mobile app',
          status: 'in-progress',
          projectId: projects[1].id,
        },
        {
          title: 'Create social media content',
          description: 'Design and schedule social media posts',
          status: 'completed',
          projectId: projects[2].id,
        },
      ],
    });
    
    console.log('Tasks created successfully');
    
    // Create project logs
    await prisma.projectLog.createMany({
      data: [
        {
          projectId: projects[0].id,
          message: 'Project started',
          type: 'info',
          timestamp: new Date('2023-01-10'),
        },
        {
          projectId: projects[0].id,
          message: 'Design phase completed',
          type: 'success',
          timestamp: new Date('2023-02-15'),
        },
        {
          projectId: projects[1].id,
          message: 'Project planning initiated',
          type: 'info',
          timestamp: new Date('2023-03-01'),
        },
        {
          projectId: projects[2].id,
          message: 'Campaign launched',
          type: 'info',
          timestamp: new Date('2023-02-01'),
        },
        {
          projectId: projects[2].id,
          message: 'Campaign completed successfully',
          type: 'success',
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
          sender: 'Alex Johnson',
          timestamp: new Date('2023-03-15T09:30:00'),
        },
        {
          content: 'We\'re making good progress. Homepage is almost done!',
          sender: 'John Smith',
          timestamp: new Date('2023-03-15T09:35:00'),
        },
        {
          content: 'Great! Looking forward to seeing it.',
          sender: 'Alex Johnson',
          timestamp: new Date('2023-03-15T09:40:00'),
        },
        {
          content: 'When is our next team meeting?',
          sender: 'Emily Wang',
          timestamp: new Date('2023-03-16T10:15:00'),
        },
        {
          content: 'Tomorrow at 2pm in the main conference room.',
          sender: 'Alex Johnson',
          timestamp: new Date('2023-03-16T10:20:00'),
        },
      ],
    });
    
    console.log('Messages created successfully');
    
    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: alexUser.id,
          title: 'New Project Assigned',
          content: 'You have been assigned to the Website Redesign project',
          type: 'assignment',
          read: true,
          timestamp: new Date('2023-01-10T10:00:00'),
        },
        {
          userId: alexUser.id,
          title: 'Meeting Reminder',
          content: 'Team meeting starts in 30 minutes',
          type: 'reminder',
          read: false,
          timestamp: new Date('2023-03-16T13:30:00'),
        },
        {
          userId: sarahUser.id,
          title: 'Task Completed',
          content: 'Design homepage mockup has been completed',
          type: 'update',
          read: false,
          timestamp: new Date('2023-02-15T15:45:00'),
        },
        {
          userId: sarahUser.id,
          title: 'New Message',
          content: 'You have a new message from Alex Johnson',
          type: 'message',
          read: true,
          timestamp: new Date('2023-03-15T09:30:00'),
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