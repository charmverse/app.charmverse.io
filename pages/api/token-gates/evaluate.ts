import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGateEvaluationAttempt, TokenGateEvaluationResult } from 'lib/tokenGates/evaluateEligibility';
import { evaluateTokenGateEligibility } from 'lib/tokenGates/evaluateEligibility';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['authSig', 'spaceIdOrDomain'], 'body'))
  .post(evaluateWallet);

async function evaluateWallet(req: NextApiRequest, res: NextApiResponse<TokenGateEvaluationResult>) {
  const body = req.body as TokenGateEvaluationAttempt;

  const result = await evaluateTokenGateEligibility(body);

  res.status(200).send(result);
}

export default withSessionRoute(handler);
