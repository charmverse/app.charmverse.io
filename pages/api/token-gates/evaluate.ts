
import { postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { evalueTokenGateEligibility } from 'lib/token-gates/evaluateEligibility';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet (req: NextApiRequest, res: NextApiResponse) {

  const user = req.session.user;

  const result = await evalueTokenGateEligibility({
    ...req.body,
    userId: user.id
  });

  if (result.canJoinSpace) {
    res.status(200).send(result);
  }
  else {
    res.status(401).send(result);
  }

}

export default withSessionRoute(handler);

export async function logWorkspaceJoinedViaTokenGate (workspaceName: string) {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: `A user has joined the ${workspaceName} workspace via token gate.`
  });
}
