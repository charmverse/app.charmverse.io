import { log } from '@packages/core/log';
import { applyTokenGates } from '@packages/lib/tokenGates/applyTokenGates';
import { evaluateTokenGateEligibility } from '@packages/lib/tokenGates/evaluateEligibility';
import { getSpaceMembershipWithRoles } from '@packages/spaces/getSpaceMembershipWithRoles';
import { InvalidInputError } from '@packages/utils/errors';

export async function reevaluateRoles({ userId, spaceId }: { spaceId: string; userId: string }) {
  try {
    const spaceMembership = await getSpaceMembershipWithRoles({ spaceId, userId });
    if (!spaceMembership) {
      throw new InvalidInputError('User is not a member of this space.');
    }

    if (!spaceMembership.space.tokenGates.length) {
      log.debug('Space does not have any token gates to reevaluate.', { spaceId });
      return [];
    }

    const userRoles = spaceMembership?.spaceRoleToRole.map((r) => r.roleId) ?? [];

    const { eligibleGates } = await evaluateTokenGateEligibility({
      spaceIdOrDomain: spaceId,
      userId
    });

    await applyTokenGates({
      userId,
      spaceId,
      commit: true,
      joinType: 'token_gate',
      reevaluate: true,
      tokenGateIds: eligibleGates ?? []
    });

    const updatedSpaceMembership = await getSpaceMembershipWithRoles({ spaceId, userId });
    const updatedUserRoles = updatedSpaceMembership?.spaceRoleToRole.map((r) => r.roleId) ?? [];
    const newRoles = updatedUserRoles.filter((r) => !userRoles.includes(r)) || [];
    return newRoles;
  } catch (error) {
    log.warn('Error reevaluating roles', { error, userId, spaceId });
    return [];
  }
}
