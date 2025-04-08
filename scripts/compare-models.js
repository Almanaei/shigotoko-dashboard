// Script to compare User and Employee models and help with migration planning
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareModels() {
  try {
    console.log('Connecting to database...');
    
    // Get counts of each model
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    const sessionCount = await prisma.session.count();
    const departmentCount = await prisma.department.count();
    
    console.log('\nModel Counts:');
    console.log(`Users: ${userCount}`);
    console.log(`Employees: ${employeeCount}`);
    console.log(`Sessions: ${sessionCount}`);
    console.log(`Departments: ${departmentCount}`);
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        sessions: true
      }
    });
    
    // Get all employees
    const employees = await prisma.employee.findMany({
      include: {
        department: true
      }
    });
    
    console.log('\nUser Distribution:');
    
    // Group users by role
    const usersByRole = {};
    users.forEach(user => {
      const role = user.role || 'no-role';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });
    
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    
    console.log('\nEmployee Distribution:');
    
    // Group employees by department
    const employeesByDept = {};
    employees.forEach(emp => {
      const dept = emp.department?.name || 'no-department';
      employeesByDept[dept] = (employeesByDept[dept] || 0) + 1;
    });
    
    Object.entries(employeesByDept).forEach(([dept, count]) => {
      console.log(`  ${dept}: ${count}`);
    });
    
    // Check for email overlap between User and Employee models
    const userEmails = users.map(u => u.email);
    const employeeEmails = employees.map(e => e.email);
    
    const emailOverlap = userEmails.filter(email => employeeEmails.includes(email));
    
    console.log('\nEmail Overlap:');
    console.log(`  ${emailOverlap.length} overlapping emails between User and Employee models`);
    
    if (emailOverlap.length > 0) {
      console.log('  Overlapping emails:');
      emailOverlap.forEach(email => {
        console.log(`    - ${email}`);
      });
    }
    
    // Migration analysis
    console.log('\nMigration Analysis:');
    
    // Option A: Add auth fields to Employee
    console.log('\nOption A - Add auth fields to Employee:');
    console.log(`  Required actions: Add password and role to ${employeeCount} Employee records`);
    console.log(`  Gap: ${userCount - emailOverlap.length} Users without corresponding Employee records`);
    
    // Option B: Create Auth-Employee relationship
    console.log('\nOption B - Create Auth-Employee relationship:');
    console.log(`  Required actions: Link ${Math.min(userCount, employeeCount)} User-Employee records`);
    console.log(`  New mappings needed: ${Math.max(0, userCount - emailOverlap.length)}`);
    
    // Recommended approach
    const recommendedApproach = userCount > (employeeCount * 2) ? 'B' : 'A';
    console.log(`\nRecommended Approach: Option ${recommendedApproach}`);
    
    if (recommendedApproach === 'A') {
      console.log('  Reasoning: Fewer User records or good overlap, simpler to migrate to Employee model');
    } else {
      console.log('  Reasoning: Many more User records than Employee records, better to maintain separate tables');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareModels(); 