import type { Space } from '@charmverse/core/prisma';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from '@packages/metrics/mixpanel/updateTrackUserProfileById';
import { logWorkspaceJoinedViaTokenGate } from '@packages/metrics/postToDiscord';
import { UnauthorisedActionError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { applyDiscordGate } from '@packages/lib/discord/collabland/applyDiscordGate';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { requireKeys } from '@packages/lib/middleware/requireKeys';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { TokenGateJoinType } from '@packages/lib/tokenGates/interfaces';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishMemberEvent } from '@packages/lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys([{ key: 'spaceId', valueType: 'uuid' }], 'body'))
  .post(verifyDiscordGateEndpoint);

async function verifyDiscordGateEndpoint(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { spaceId, joinType } = req.body as { spaceId: string; joinType: TokenGateJoinType };
  const userId = req.session.user?.id;

  const space = await applyDiscordGate({ spaceId, userId });

  if (!space) {
    throw new UnauthorisedActionError('You do not have access to this space');
  }

  trackUserAction('join_a_workspace', {
    spaceId,
    userId,
    source: joinType ?? 'token_gate'
  });

  publishMemberEvent({
    scope: WebhookEventNames.UserJoined,
    spaceId,
    userId
  });

  updateTrackUserProfileById(req.session.user.id);

  logWorkspaceJoinedViaTokenGate(spaceId);

  return res.status(201).json(space);
}

export default withSessionRoute(handler);
