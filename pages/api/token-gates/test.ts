import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGate } from 'lib/tokenGates/interfaces';
import { validateTokenGate } from 'lib/tokenGates/validateTokenGate';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

export type TokenGateTestRequest = { address: string; tokenGateId: string };
export type TokenGateTestResponse = { success: boolean };

handler
  .use(requireUser)
  .use(requireKeys(['address', 'tokenGateId'], 'query'))
  .get(testTokenGate);

async function testTokenGate(req: NextApiRequest, res: NextApiResponse<TokenGateTestResponse>) {
  const { address, tokenGateId } = req.query as TokenGateTestRequest;

  const tokenGate = await prisma.tokenGate.findUniqueOrThrow({
    where: {
      id: tokenGateId
    }
  });

  const validTokenGate = await validateTokenGate(tokenGate as unknown as TokenGate, address);

  res.send({ success: !!validTokenGate });
}

export default withSessionRoute(handler);
