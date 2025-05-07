import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type {
  TokenGateEvaluationAttempt,
  TokenGateEvaluationResult
} from '@packages/lib/tokenGates/evaluateEligibility';
import { evaluateTokenGateEligibility } from '@packages/lib/tokenGates/evaluateEligibility';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['spaceIdOrDomain'], 'body'))
  .post(evaluateWallet);

async function evaluateWallet(req: NextApiRequest, res: NextApiResponse<TokenGateEvaluationResult>) {
  const body = req.body as TokenGateEvaluationAttempt;
  const userId = req.session.user.id;

  const result = await evaluateTokenGateEligibility({ ...body, userId });

  res.status(200).send(result);
}

export default withSessionRoute(handler);
