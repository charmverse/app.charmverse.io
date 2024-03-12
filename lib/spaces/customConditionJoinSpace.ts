import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { SpaceRole } from '@charmverse/core/prisma-client';

import { getSpace } from 'lib/spaces/getSpace';
import { joinSpace } from 'lib/spaces/joinSpace';

export type CustomJoinParams = {
  proposalTemplate?: string;
};

export async function customConditionJoinSpace({
  userId,
  spaceId,
  params
}: {
  userId: string;
  spaceId: string;
  params: CustomJoinParams;
}) {
  if (!userId || !spaceId) {
    throw new InvalidInputError(`Please provide a valid ${!spaceId ? 'space' : 'user'} id.`);
  }

  if (!params || !params.proposalTemplate) {
    throw new InvalidInputError(`Please provide a valid conditions to join space.`);
  }

  // we can handle different criteria here in the future
  let spaceRole: SpaceRole | null | void = null;
  if (params.proposalTemplate) {
    // check if proposal id is valid
    spaceRole = await joinSpace({ userId, spaceId, source: 'proposal_template' });
    log.info('User joined space via proposal template', { userId, spaceId, proposalTemplate: params.proposalTemplate });
  }

  if (spaceRole) {
    return getSpace(spaceId);
  }
}
