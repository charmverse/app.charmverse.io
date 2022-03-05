
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { verifyJwt } from 'lit-js-sdk';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(verifyWallet);

async function verifyWallet (req: NextApiRequest, res: NextApiResponse) {

  const tokenGateId = req.query.id as string;
  const { jwt } = req.body;

  const tokenGate = await prisma.tokenGate.findFirst({
    where: { id: tokenGateId }
  });

  try {
    const result = await verifyJwt({ jwt });
    console.log('tokenGate', tokenGate);
    console.log('result', result);
    res.status(200).json({ result });
  }
  catch (err) {
    res.status(200).json({ error: (<Error> err).message });
  }
}

export default withSessionRoute(handler);
