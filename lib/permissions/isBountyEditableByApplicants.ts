import type { Bounty } from '@prisma/client';

import type { Member } from 'lib/members/interfaces';

import type { BountyPermissions } from './bounties';
import type { PagePermissionMeta, TargetPermissionGroup } from './interfaces';
import { permissionTemplates } from './pages/page-permission-mapping';

export interface BountyPagePermissionIntersectionQuery {
  bountyPermissions: Partial<BountyPermissions>;
  pagePermissions: PagePermissionMeta[];
  members: Member[];
  bounty: Bounty;
}
function pagePermissionGrantsEditAccess(permission: PagePermissionMeta): boolean {
  return permissionTemplates[permission.permissionLevel].includes('edit_content');
}

/**
 * Determine if there are some users who can edit the page and are also allowed to submit
 * @returns
 */
export function isBountyEditableByApplicants({
  bountyPermissions,
  pagePermissions,
  members,
  bounty
}: BountyPagePermissionIntersectionQuery): boolean {
  const bountySubmitters = bountyPermissions.submitter ?? [];

  if (pagePermissions.some((p) => p.spaceId === bounty.spaceId && pagePermissionGrantsEditAccess(p))) {
    return true;
  }

  // If the bounty is open to the whole space, we just need to search for any permissions that grant edit access that are not linked to the creating user
  // For backwards compatibility, if the bounty has no submitter permissions, assume the space is allowed to submit
  if (bountySubmitters.length === 0 || bountySubmitters.some((p) => p.group === 'space')) {
    if (pagePermissions.some((p) => p.userId !== bounty.createdBy && pagePermissionGrantsEditAccess(p))) {
      return true;
    } else {
      return false;
    }
  }

  // Map submitter roles for easier lookup
  const mappedBountyPermissions = (
    (bountySubmitters.filter((p) => p.group === 'role') ?? []) as TargetPermissionGroup<'role'>[]
  ).reduce((acc, val) => {
    acc[val.id] = val;
    return acc;
  }, {} as Record<string, TargetPermissionGroup<'role'>>);

  // Map page permissions for easier lookup
  const mappedPagePermissions = (pagePermissions.filter((p) => p.roleId || p.userId) ?? []).reduce((acc, val) => {
    acc[val.roleId ?? (val.userId as string)] = val;
    return acc;
  }, {} as Record<string, PagePermissionMeta>);

  for (const member of members) {
    // Evaluate this for all members except the bounty creator
    if (member.id !== bounty.createdBy) {
      const relevantRoles = member.roles.filter((role) => mappedBountyPermissions[role.id]);

      if (relevantRoles.length > 0) {
        // If the member has a role that is allowed to submit, check if they have an individual page permission that grants edit access
        if (mappedPagePermissions[member.id] && pagePermissionGrantsEditAccess(mappedPagePermissions[member.id])) {
          return true;
        }
      }

      for (const role of relevantRoles) {
        // If the role has a page permission that grants edit access, return true
        if (mappedPagePermissions[role.id] && pagePermissionGrantsEditAccess(mappedPagePermissions[role.id])) {
          return true;
        }
      }
    }
  }

  return false;
}
