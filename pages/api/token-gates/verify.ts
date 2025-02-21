import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from '@packages/metrics/mixpanel/updateTrackUserProfileById';
import { logWorkspaceJoinedViaTokenGate } from '@packages/metrics/postToDiscord';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { applyTokenGates } from 'lib/tokenGates/applyTokenGates';
import type { TokenGateVerificationRequest } from 'lib/tokenGates/applyTokenGates';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishMemberEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['spaceId', 'tokenGateIds', 'commit'], 'body'))
  .post(verifyWallet);

async function verifyWallet(req: NextApiRequest, res: NextApiResponse<void>) {
  const userId = req.session.user.id;
  const tokenGateVerification: TokenGateVerificationRequest = {
    ...req.body,
    userId
  };

  const result = await applyTokenGates({ ...tokenGateVerification, userId });

  if (tokenGateVerification.commit) {
    trackUserAction('join_a_workspace', {
      spaceId: tokenGateVerification.spaceId,
      userId,
      source: tokenGateVerification.joinType ?? 'token_gate'
    });
    publishMemberEvent({
      scope: WebhookEventNames.UserJoined,
      spaceId: tokenGateVerification.spaceId,
      userId
    });

    updateTrackUserProfileById(userId);

    logWorkspaceJoinedViaTokenGate(result.space.id);
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
