import { InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';

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

  if (params.proposalTemplate) {
    await joinSpace({ userId, spaceId, source: 'proposal_template' });
    log.info('User joined space via proposal template', { userId, spaceId, proposalTemplate: params.proposalTemplate });
  }
}
