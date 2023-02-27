import type { AuthSig } from 'lit-js-sdk';

import { getSpaceMembershipWithRoles } from 'lib/spaces/getSpaceMembershipWithRoles';
import { applyTokenGates } from 'lib/token-gates/applyTokenGates';
import { evalueTokenGateEligibility } from 'lib/token-gates/evaluateEligibility';
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
      throw new InvalidInputError('Space does not have any token gates.');
    }

    const userRoles = spaceMembership?.spaceRoleToRole.map((r) => r.roleId) ?? [];

    const { gateTokens } = await evalueTokenGateEligibility({
      spaceIdOrDomain: spaceId,
      authSig,
      userId
    });

    await applyTokenGates({
      userId,
      spaceId,
      commit: true,
      joinType: 'token_gate',
      reevaluate: true,
      tokens:
        gateTokens.map((tk) => ({
          signedToken: tk.signedToken,
          tokenGateId: tk.tokenGate.id
        })) ?? []
    });

    const updatedSpaceMembership = await getSpaceMembershipWithRoles({ spaceId, userId });
    const updatedUserRoles = updatedSpaceMembership?.spaceRoleToRole.map((r) => r.roleId) ?? [];
    const newRoles = updatedUserRoles.filter((r) => !userRoles.includes(r)) || [];

    return newRoles;
  } catch (e) {
    return [];
  }
}
