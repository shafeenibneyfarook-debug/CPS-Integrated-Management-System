export const roleDefinitions = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Oversees system access and manages the core master data setup.',
    capabilities: ['Manage user access', 'Maintain master data', 'Monitor module activity']
  },
  {
    id: 'manager',
    title: 'Manager',
    description: 'Reviews and supervises client, supplier, and project records.',
    capabilities: ['Review master records', 'Approve updates', 'Monitor business operations']
  },
  {
    id: 'operations',
    title: 'Operations Officer',
    description: 'Creates and updates client, supplier, and project records.',
    capabilities: ['Create master records', 'Update records', 'Manage project locations']
  },
  {
    id: 'accounts',
    title: 'Accounts Officer',
    description: 'Supports finance-related follow-up for the master data module.',
    capabilities: ['Review account-related records', 'Support data follow-up', 'Coordinate with operations']
  }
];

export const defaultUser = {
  id: 1,
  name: 'CPS Administrator',
  email: 'admin@cps.local',
  role: 'admin',
  roleLabel: 'Admin'
};
