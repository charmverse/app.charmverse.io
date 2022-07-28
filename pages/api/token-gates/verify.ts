
import { postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { applyTokenGates } from 'lib/token-gates/applyTokenGates';
import { TokenGateVerification } from 'lib/token-gates/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet (req: NextApiRequest, res: NextApiResponse) {

  const tokenGateVerification: TokenGateVerification = {
    ...req.body,
    userId: req.session.user.id
  };

  const result = await applyTokenGates(tokenGateVerification);

  res.status(200).send(result);

}

export default withSessionRoute(handler);

export async function logWorkspaceJoinedViaTokenGate (workspaceName: string) {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: `A user has joined the ${workspaceName} workspace via token gate.`
  });
}
