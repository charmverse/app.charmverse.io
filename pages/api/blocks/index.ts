
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlocks).post(createBlocks).put(updateBlocks);

async function getBlocks (req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const referer = req.headers.referer as string;
  const pathnameParts = referer ? new URL(referer).pathname.split('/') : [];
  const spaceDomain = pathnameParts[1];
  if (!spaceDomain) {
    return res.status(400).json({ error: 'spaceId is required' });
  }
  // publicly shared focalboard
  if (spaceDomain === 'share') {
    const pageId = pathnameParts[2];
    if (!pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      return res.status(404).json({ error: 'page not found' });
    }
    const blocks = page.boardId ? await prisma.block.findMany({ where: { rootId: page.boardId } }) : [];
    return res.status(200).json(blocks);
  }

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });
  if (space) {
    const blocks = await prisma.block.findMany({
      where: {
        id: req.query.id
          ? req.query.id as string
          : req.query.ids
            ? {
              in: req.query.ids as string[]
            }
            : undefined,
        spaceId: space.id
      }
    });
    return res.status(200).json(blocks);
  }
  return res.status(400).json({ error: 'spaceId is invalid' });
}

async function createBlocks (req: NextApiRequest, res: NextApiResponse<Block[]>) {
  const data = req.body as Omit<Block, ServerBlockFields>[];
  const referer = req.headers.referer as string;
  const spaceDomain = referer ? new URL(referer).pathname.split('/')[1] : null;

  if (spaceDomain) {
    const space = await prisma.space.findUnique({
      where: {
        domain: spaceDomain
      }
    });
    if (space) {
      const newBlocks = data.map(block => ({
        ...block,
        fields: block.fields as any,
        spaceId: space.id,
        createdBy: req.session.user.id,
        updatedBy: req.session.user.id
      }));
      await prisma.block.createMany({
        data: newBlocks
      });
      return res.status(200).json(newBlocks);
    }
  }

  // @ts-ignore - JsonValue is not compatible with InputJsonValue :(
  // const blocks = await prisma.block.createMany({ data });
  // console.log('blocks', blocks);
  return res.status(200).json(data);
}

async function updateBlocks (req: NextApiRequest, res: NextApiResponse<Block[]>) {
  const blocks: Block[] = req.body;
  const ops = blocks.map(block => {
    return prisma.block.update({
      where: { id: block.id },
      data: {
        ...block,
        fields: block.fields as any,
        updatedAt: new Date(),
        updatedBy: req.session.user.id
      }
    });
  });
  const updated = await prisma.$transaction(ops);
  return res.status(200).json(updated);
}

export default withSessionRoute(handler);
