import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { applyDiscordGate } from 'lib/discord/collabland/applyDiscordGate';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logWorkspaceJoinedViaTokenGate } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGateJoinType } from 'lib/tokenGates/interfaces';
import { UnauthorisedActionError } from 'lib/utils/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishMemberEvent } from 'lib/webhookPublisher/publishEvent';

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
