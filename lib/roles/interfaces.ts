import type { Role, User } from '@prisma/client';

import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';

export interface RoleMembersQuery {
  roleId: string;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
}

export type RoleWithMembers = Role & { users: User[] };

/**
 * Rollup of number of users in each role
 */
export type Roleup = Pick<Role, 'id' | 'name'> & { members: number }

export type RoleupWithMembers = Roleup & { users: (User | LoggedInUser | Member)[] };
