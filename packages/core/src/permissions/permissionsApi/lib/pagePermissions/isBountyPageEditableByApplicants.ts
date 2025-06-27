import type { BountyPermissionLevel } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, PageNotFoundError } from '@packages/core/errors';
import type { PagePermissionMeta, Resource, TargetPermissionGroup } from '@packages/core/permissions';

import { pagePermissionGrantsEditAccess } from './utilities/pagePermissionGrantsEditAccess';

/**
 * Determine if there are some users who can edit the page and are also allowed to submit
 * @returns
 */
export async function isBountyPageEditableByApplicants({ resourceId }: Resource): Promise<{ editable: boolean }> {
  const page = await prisma.page.findUnique({
    where: {
      id: resourceId
    },
    select: {
      permissions: true,
      type: true,
      bounty: {
        select: {
          createdBy: true,
          spaceId: true,
          permissions: true
        }
      }
    }
  });

  if (!page) {
    throw new PageNotFoundError(resourceId);
  } else if (!page.bounty) {
    throw new InvalidInputError(`Page does not have a linked bounty`);
  }

  const { bounty, permissions: pagePermissions } = page;

  const bountyPermissionsWithAssignee = bounty.permissions
    .map((bountyPermission) => {
      const group = bountyPermission.roleId
        ? 'role'
        : bountyPermission.spaceId
          ? 'space'
          : bountyPermission.userId
            ? 'user'
            : null;

      if (!group) {
        return null;
      }
      return {
        group,
        id:
          group === 'role'
            ? bountyPermission.roleId
            : group === 'space'
              ? bountyPermission.spaceId
              : bountyPermission.userId,
        permissionLevel: bountyPermission.permissionLevel
      } as TargetPermissionGroup & { permissionLevel: BountyPermissionLevel };
    })
    .filter((mappedPermission) => !!mappedPermission);

  const bountySubmitters = bountyPermissionsWithAssignee.filter(
    (p: TargetPermissionGroup & { permissionLevel: BountyPermissionLevel }) => p.permissionLevel === 'submitter'
  );

  if (pagePermissions.some((p) => p.spaceId === bounty.spaceId && pagePermissionGrantsEditAccess(p))) {
    return { editable: true };
  }

  // If the bounty is open to the whole space, we just need to search for any permissions that grant edit access that are not linked to the creating user
  // For backwards compatibility, if the bounty has no submitter permissions, assume the space is allowed to submit
  if (
    bountySubmitters.length === 0 ||
    bountySubmitters.some(
      (p: TargetPermissionGroup & { permissionLevel: BountyPermissionLevel }) => p.group === 'space'
    )
  ) {
    if (
      pagePermissions.some(
        (p) => (!p.userId || (!!p.userId && p.userId !== bounty.createdBy)) && pagePermissionGrantsEditAccess(p)
      )
    ) {
      return { editable: true };
    } else {
      return { editable: false };
    }
  }

  // Map page permissions for easier lookup
  const mappedPagePermissions = (pagePermissions.filter((p) => p.roleId || p.userId) ?? []).reduce(
    (acc, val) => {
      acc[val.roleId ?? (val.userId as string)] = val;
      return acc;
    },
    {} as Record<string, PagePermissionMeta>
  );

  // Map submitter roles for easier lookup
  const mappedBountyPermissions = (
    (bountySubmitters.filter(
      (p: TargetPermissionGroup & { permissionLevel: BountyPermissionLevel }) => p.group === 'role'
    ) ?? []) as TargetPermissionGroup<'role'>[]
  ).reduce(
    (acc, val) => {
      acc[val.id] = val;
      return acc;
    },
    {} as Record<string, TargetPermissionGroup<'role'>>
  );

  const entries = Object.entries(mappedPagePermissions);

  for (const [key, value] of entries) {
    if (pagePermissionGrantsEditAccess(value) && mappedBountyPermissions[key]) {
      return { editable: true };
    }
  }

  const submittersByRole = bountySubmitters.filter(
    (submitter: TargetPermissionGroup & { permissionLevel: BountyPermissionLevel }) => submitter.group === 'role'
  );

  // Early exit just in case we don't have applicable permissions
  // We have userId in bounty permissions but do not use it yet
  if (submittersByRole.length === 0) {
    return { editable: false };
  }

  const members = await prisma.spaceRole
    .findMany({
      where: {
        spaceId: bounty.spaceId
      },
      select: {
        userId: true,
        spaceRoleToRole: {
          select: {
            roleId: true
          }
        }
      }
    })
    .then((_memberSpaceRoles) =>
      _memberSpaceRoles.map((spaceRole) => {
        return {
          id: spaceRole.userId,
          roles: spaceRole.spaceRoleToRole.map((sr) => ({ id: sr.roleId }))
        };
      })
    );

  for (const member of members) {
    // Evaluate this for all members except the bounty creator
    if (member.id !== bounty.createdBy) {
      const relevantRoles = member.roles.filter((role) => !!mappedBountyPermissions[role.id]);

      if (relevantRoles.length > 0) {
        // If the member has a role that is allowed to submit, check if they have an individual page permission that grants edit access
        if (mappedPagePermissions[member.id] && pagePermissionGrantsEditAccess(mappedPagePermissions[member.id])) {
          return { editable: true };
        }
      }

      for (const role of relevantRoles) {
        // If the role has a page permission that grants edit access, return true
        if (mappedPagePermissions[role.id] && pagePermissionGrantsEditAccess(mappedPagePermissions[role.id])) {
          return { editable: true };
        }
      }
    }
  }

  return { editable: false };
}
