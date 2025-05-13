import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from '@packages/metrics/mixpanel/updateTrackUserProfileById';
import { logWorkspaceJoinedViaTokenGate } from '@packages/metrics/postToDiscord';
import { InvalidInputError, UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { requireKeys } from '@packages/lib/middleware/requireKeys';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { addUserToSpace } from '@packages/lib/summon/addUserToSpace';
import { verifyMembership } from '@packages/lib/summon/verifyMembership';
import type { TokenGateJoinType } from '@packages/lib/tokenGates/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishMemberEvent } from '@packages/lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys([{ key: 'spaceId', valueType: 'uuid' }], 'query'))
  .get(joinSpaceEndpoint);

async function joinSpaceEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;
  const userId = req.session?.user?.id;

  const result = await verifyMembership({ spaceId, userId });

  if (!result.isVerified) {
    throw new InvalidInputError('You are not a member of this space');
  }

  await addUserToSpace({ spaceId, userId, xpsUserId: result.summonUserId });

  trackUserAction('join_a_workspace', {
    spaceId,
    userId,
    source: (req.query.joinType as TokenGateJoinType) ?? 'token_gate'
  });

  publishMemberEvent({
    scope: WebhookEventNames.UserJoined,
    spaceId,
    userId
  });

  updateTrackUserProfileById(req.session.user.id);

  logWorkspaceJoinedViaTokenGate(spaceId);

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
