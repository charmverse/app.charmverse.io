import { BountyOperation, Role, Bounty } from '@prisma/client';
import { Roleup } from 'lib/roles/interfaces';
import { humaniseList, upperCaseFirstCharacter } from '../../utilities/strings';
import { TargetPermissionGroup } from '../interfaces';
import { HumanisedBountyAccessSummary, SupportedHumanisedAccessConditions } from './interfaces';

/**
 * Returns a human friendly roleup of access conditions
 */
export function humaniseBountyAccessConditions ({
  permissionLevel,
  assignees,
  roles,
  bounty
}: {
  permissionLevel: SupportedHumanisedAccessConditions
  // The array present on the target key (creator, reviewer, submitter or viewer) of a Bounty Permissions object
  // For submitters, we currently only support roles or whole space
  assignees: TargetPermissionGroup[]
  // Full list of roles in space (or at least role data for assigned roles)
  roles: Roleup[]
  bounty: Bounty
}): HumanisedBountyAccessSummary {
  const hasSpacePermission = assignees.some(({ group }) => group === 'space');

  let totalRoleMembers = 0;
  // No need to calculate roles if the target level is allowed for the whole space
  const assignedRoleNames = (hasSpacePermission ? [] : assignees)
    .filter(a => a.group === 'role')
    .map(r => {
      const matchingRole = roles.find(role => role.id === r.id);

      totalRoleMembers += matchingRole?.members ?? 0;

      return matchingRole?.name ?? '';
    });

  const humanisedRoleNames = humaniseList({
    capitaliseFirstCharacter: true,
    content: assignedRoleNames,
    conjunction: 'or'
  });

  // No need to count if not reviewer mode
  const assignedReviewerUserCount = permissionLevel !== 'reviewer' ? 0 : assignees.reduce((count, { group }) => {
    return count + (group === 'user' ? 1 : 0);
  }, 0);

  const totalSubmitters = hasSpacePermission ? 'all' : totalRoleMembers;

  const result: HumanisedBountyAccessSummary = {
    permissionLevel,
    phrase: '',
    roleNames: assignedRoleNames
  };

  // console.log('Assignees', assignees);

  // console.log('Humanising', roles, assignedRoleNames);

  switch (permissionLevel) {
    case 'submitter':

      if (hasSpacePermission && bounty.approveSubmitters) {
        result.phrase = 'Any workspace member can apply to work on this bounty.';
      }
      else if (hasSpacePermission && !bounty.approveSubmitters) {
        result.phrase = 'Any workspace member can directly submit their to work to this bounty.';
      // Roles mode
      }
      // Bounty requires applications
      else if (!hasSpacePermission && bounty.approveSubmitters && assignedRoleNames.length === 1) {
        result.phrase = `Only ${totalSubmitters} workspace members with the ${upperCaseFirstCharacter(assignedRoleNames[0])} role can apply to work on this bounty.`;
      }
      else if (!hasSpacePermission && bounty.approveSubmitters && assignedRoleNames.length > 1) {
        result.phrase = `Only ${totalSubmitters} workspace members with the ${humanisedRoleNames} roles can apply to work on this bounty.`;
      }
      // Bounty is open to submitters
      else if (!hasSpacePermission && !bounty.approveSubmitters && assignedRoleNames.length === 1) {
        result.phrase = `Only ${totalSubmitters} workspace members with the ${upperCaseFirstCharacter(assignedRoleNames[0])} role can directly work on this bounty.`;
      }
      else if (!hasSpacePermission && !bounty.approveSubmitters && assignedRoleNames.length > 1) {
        result.phrase = `Only ${totalSubmitters} workspace members with one of the ${humanisedRoleNames} roles can directly work on this bounty.`;
      }
      break;

    case 'reviewer':
      if (assignedRoleNames.length === 0 && assignedReviewerUserCount > 0) {
        result.phrase = `There are ${assignedReviewerUserCount} users assigned to review work for this bounty.`;
      }
      else if (assignedRoleNames.length > 0 && assignedReviewerUserCount === 0) {
        result.phrase = `There are ${assignedRoleNames.length} roles assigned to review work this bounty.`;
      }
      else if (assignedRoleNames.length > 0 && assignedReviewerUserCount > 0) {
        result.phrase = `There are ${totalRoleMembers} reviewers for this bounty (${assignedReviewerUserCount} users and ${assignedRoleNames.length} roles).`;
      }
      break;
    default:
      // No action needed, we will return an empty phrase.
      break;
  }
  return result;
}
