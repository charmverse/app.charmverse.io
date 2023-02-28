import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logWorkspaceJoinedViaTokenGate } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { applyTokenGates } from 'lib/token-gates/applyTokenGates';
import type { TokenGateVerification } from 'lib/token-gates/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishMemberEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet(req: NextApiRequest, res: NextApiResponse) {
  const tokenGateVerification: TokenGateVerification = {
    ...req.body,
    userId: req.session.user.id
  };

  const result = await applyTokenGates(tokenGateVerification);

  if (tokenGateVerification.commit) {
    trackUserAction('join_a_workspace', {
      spaceId: tokenGateVerification.spaceId,
      userId: req.session.user.id,
      source: tokenGateVerification.joinType ?? 'token_gate'
    });
    publishMemberEvent({
      scope: WebhookEventNames.UserJoined,
      spaceId: tokenGateVerification.spaceId,
      userId: req.session.user.id
    });

    updateTrackUserProfileById(req.session.user.id);

    logWorkspaceJoinedViaTokenGate(result.space.id);
  }

  res.status(200).send(result);
}

export default withSessionRoute(handler);
