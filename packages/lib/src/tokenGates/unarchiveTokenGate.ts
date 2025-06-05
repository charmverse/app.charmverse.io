import { prisma } from '@charmverse/core/prisma-client';
import { getTokenGateLimits } from '@packages/subscriptions/featureRestrictions';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';

interface UnarchiveTokenGateInput {
  tokenGateId: string;
  spaceId: string;
}

export async function unarchiveTokenGate({ tokenGateId, spaceId }: UnarchiveTokenGateInput) {
  const tokenGate = await prisma.tokenGate.findUnique({
    where: {
      id: tokenGateId
    },
    select: {
      id: true,
      spaceId: true,
      archived: true
    }
  });

  if (!tokenGate) {
    throw new DataNotFoundError(`Token gate with id ${tokenGateId} not found`);
  }

  if (!tokenGate.archived) {
    throw new InvalidInputError('Token gate is not archived');
  }

  if (tokenGate.spaceId !== spaceId) {
    throw new InvalidInputError('Token gate does not belong to this space');
  }

  // Get space details to check tier
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionTier: true
    }
  });

  // Get current active token gates count
  const activeTokenGatesCount = await prisma.tokenGate.count({
    where: {
      spaceId,
      archived: false
    }
  });

  // Get max token gates allowed for this tier
  const { count: maxTokenGates } = getTokenGateLimits(space.subscriptionTier);

  // Check if unarchiving would exceed the limit
  if (activeTokenGatesCount >= maxTokenGates) {
    throw new UndesirableOperationError(
      `Cannot unarchive token gate. You have reached the maximum number of token gates (${maxTokenGates}) for your plan.`
    );
  }

  const updatedTokenGate = await prisma.tokenGate.update({
    where: {
      id: tokenGateId
    },
    data: {
      archived: false
    }
  });

  return updatedTokenGate;
}
