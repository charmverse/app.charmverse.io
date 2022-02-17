
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlocks).post(createBlocks);

async function getBlocks (req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const referer = req.headers.referer as string;
  const spaceDomain = referer ? new URL(referer).pathname.split('/')[1] : null;
  if (!spaceDomain) {
    return res.status(400).json({ error: 'spaceId is required' });
  }

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });
  if (space) {
    const blocks = await prisma.block.findMany({
      where: {
        spaceId: space.id
      }
    });
    return res.status(200).json(blocks);
  }
  return res.status(400).json({ error: 'spaceId is invalid' });
}

async function createBlocks (req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const data = req.body as Block[];
  const referer = req.headers.referer as string;
  const spaceDomain = referer ? new URL(referer).pathname.split('/')[1] : null;

  if (spaceDomain) {
    const space = await prisma.space.findUnique({
      where: {
        domain: spaceDomain
      }
    });
    if (space) {
      await prisma.block.createMany({
        data: data.map(block => ({
          ...block,
          fields: block.fields as any,
          spaceId: space.id,
          createdBy: req.session.user.id,
          updatedBy: req.session.user.id
        }))
      });
      return res.status(200).json({ ok: true });
    }
  }

  // @ts-ignore - JsonValue is not compatible with InputJsonValue :(
  // const blocks = await prisma.block.createMany({ data });
  // console.log('blocks', blocks);
  return res.status(200).json(data);
}

export default withSessionRoute(handler);
