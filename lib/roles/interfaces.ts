export type RoleAssignment = {
  userId: string;
  roleId: string;
};

export type ExternalRole = { id: string | number; name: string; managed?: boolean };
