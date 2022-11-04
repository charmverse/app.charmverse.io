
import { verifyJwt } from 'lit-js-sdk';

import { prisma } from 'db';
import type { LitJwtPayload } from 'lib/token-gates/interfaces';
import { deleteUserTokenGates } from 'lib/token-gates/updateUserTokenGates';

type VerifyTokenGateMembershipProps = { userTokenGates: {
  tokenGateId: string | null;
  jwt: string | null;
  id: string;
}[]; userId: string; spaceId: string; };

export async function verifyTokenGateMembership ({ userTokenGates, userId, spaceId }: VerifyTokenGateMembershipProps): Promise<boolean> {

  if (!userTokenGates.length) {
    return true;
  }

  // We want to update only invalid token gates
  const invalidTokenGatePromises = userTokenGates.map(async userTokenGate => {
    if (!userTokenGate.jwt || !userTokenGate.tokenGateId) {
      return { id: userTokenGate.id };
    }

    const result = await verifyJwt({ jwt: userTokenGate.jwt }) as { payload: LitJwtPayload, verified: boolean };
    const isVerified = result.verified && result.payload?.orgId === spaceId;

    return isVerified ? null : { id: userTokenGate.tokenGateId };
  });

  const invalidTokenGates = (await Promise.all(invalidTokenGatePromises)).filter(Boolean) as { id: string }[];

  if (invalidTokenGates.length === userTokenGates.length) {
    // All token gates are invalid, so we can delete user from workspace
    await prisma.spaceRole.delete({
      where: {
        spaceUser: {
          userId,
          spaceId
        }
      }
    });

    return false;
  }

  deleteUserTokenGates(invalidTokenGates);

  return true;
}
