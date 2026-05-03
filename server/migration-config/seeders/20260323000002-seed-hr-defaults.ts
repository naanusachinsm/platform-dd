import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    const departments = [
      { name: 'Engineering', description: 'Software development and engineering' },
      { name: 'Product', description: 'Product management and design' },
      { name: 'Sales', description: 'Sales and business development' },
      { name: 'Marketing', description: 'Marketing and brand management' },
      { name: 'Human Resources', description: 'People operations and HR' },
      { name: 'Finance', description: 'Finance and accounting' },
      { name: 'Operations', description: 'Business operations and logistics' },
      { name: 'Customer Support', description: 'Customer service and support' },
    ];

    const designations = [
      { name: 'Intern', level: 1, description: 'Entry-level intern position' },
      { name: 'Junior Associate', level: 2, description: 'Junior-level individual contributor' },
      { name: 'Associate', level: 3, description: 'Mid-level individual contributor' },
      { name: 'Senior Associate', level: 4, description: 'Senior individual contributor' },
      { name: 'Team Lead', level: 5, description: 'Team lead with direct reports' },
      { name: 'Manager', level: 6, description: 'Department or team manager' },
      { name: 'Senior Manager', level: 7, description: 'Senior management role' },
      { name: 'Director', level: 8, description: 'Director-level leadership' },
      { name: 'VP', level: 9, description: 'Vice president' },
      { name: 'CXO', level: 10, description: 'C-suite executive' },
    ];

    const leaveTypes = [
      { name: 'Casual Leave', description: 'Personal or casual leave', defaultDays: 12, carryForward: false, isPaid: true },
      { name: 'Sick Leave', description: 'Medical or health-related leave', defaultDays: 10, carryForward: false, isPaid: true },
      { name: 'Earned Leave', description: 'Earned/privilege leave', defaultDays: 15, carryForward: true, isPaid: true },
      { name: 'Maternity Leave', description: 'Maternity leave for female employees', defaultDays: 180, carryForward: false, isPaid: true },
      { name: 'Paternity Leave', description: 'Paternity leave for male employees', defaultDays: 15, carryForward: false, isPaid: true },
      { name: 'Compensatory Off', description: 'Leave in lieu of extra work days', defaultDays: 0, carryForward: false, isPaid: true },
      { name: 'Leave Without Pay', description: 'Unpaid leave', defaultDays: 0, carryForward: false, isPaid: false },
      { name: 'Bereavement Leave', description: 'Leave for family bereavement', defaultDays: 5, carryForward: false, isPaid: true },
    ];

    const [existingDepts] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM hr_departments WHERE deleted_at IS NULL`,
    ) as any[];
    if (parseInt(existingDepts[0].cnt, 10) === 0) {
      await queryInterface.bulkInsert('hr_departments', departments.map((d) => ({
        id: uuidv4(),
        organization_id: null,
        name: d.name,
        description: d.description,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })));
    }

    const [existingDesig] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM hr_designations WHERE deleted_at IS NULL`,
    ) as any[];
    if (parseInt(existingDesig[0].cnt, 10) === 0) {
      await queryInterface.bulkInsert('hr_designations', designations.map((d) => ({
        id: uuidv4(),
        organization_id: null,
        name: d.name,
        description: d.description,
        level: d.level,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })));
    }

    const [existingLeaves] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM hr_leave_types WHERE organization_id IS NULL AND deleted_at IS NULL`,
    ) as any[];
    if (parseInt(existingLeaves[0].cnt, 10) === 0) {
      await queryInterface.bulkInsert('hr_leave_types', leaveTypes.map((l) => ({
        id: uuidv4(),
        organization_id: null,
        name: l.name,
        description: l.description,
        default_days: l.defaultDays,
        carry_forward: l.carryForward,
        is_paid: l.isPaid,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })));
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('hr_leave_types', {} as any);
    await queryInterface.bulkDelete('hr_designations', {} as any);
    await queryInterface.bulkDelete('hr_departments', {} as any);
  },
};
