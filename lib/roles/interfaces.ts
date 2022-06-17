import { Role, User } from '@prisma/client';

export interface RoleMembersQuery {
  roleId: string
}

export interface RoleAssignment {
  userId: string
  roleId: string
}

export type RoleWithMembers = Role & {users: User[]};
