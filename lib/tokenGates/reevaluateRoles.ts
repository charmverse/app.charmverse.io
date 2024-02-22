import { log } from '@charmverse/core/log';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { getSpaceMembershipWithRoles } from 'lib/spaces/getSpaceMembershipWithRoles';
import { applyTokenGates } from 'lib/tokenGates/applyTokenGates';
import { evaluateTokenGateEligibility } from 'lib/tokenGates/evaluateEligibility';
import { InvalidInputError } from 'lib/utilities/errors';

export async function reevaluateRoles({
  authSig,
  userId,
  spaceId
}: {
  spaceId: string;
  authSig: AuthSig;
  userId: string;
}) {
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
      authSig
    });

    await applyTokenGates({
      userId,
      spaceId,
      commit: true,
      joinType: 'token_gate',
      reevaluate: true,
      tokenGateIds: eligibleGates ?? [],
      walletAddress: authSig.address
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
