import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { TokenGate } from '@packages/lib/tokenGates/interfaces';
import { validateTokenGate } from '@packages/lib/tokenGates/validateTokenGate';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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
      id: tokenGateId,
      archived: false
    }
  });

  const validTokenGate = await validateTokenGate(tokenGate as unknown as TokenGate, address);

  res.send({ success: !!validTokenGate });
}

export default withSessionRoute(handler);
