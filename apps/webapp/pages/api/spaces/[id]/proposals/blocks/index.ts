import { prisma } from '@charmverse/core/prisma-client';
import { UserIsNotSpaceMemberError } from '@packages/core/errors';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { deleteBlocks } from '@packages/lib/proposals/blocks/deleteBlocks';
import { getBlocks } from '@packages/lib/proposals/blocks/getBlocks';
import type { ProposalBlockUpdateInput, ProposalBlockWithTypedFields } from '@packages/lib/proposals/blocks/interfaces';
import { upsertBlocks } from '@packages/lib/proposals/blocks/upsertBlocks';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { NotFoundError } from '@packages/nextjs/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getProposalBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .put(updateProposalBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .delete(deleteProposalBlocksHandler);

async function getProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalBlockWithTypedFields[]>) {
  const spaceId = req.query.id as string;
  const blockId = req.query.blockId as string;
  const userId = req.session.user?.id;

  if (userId) {
    const { error } = await hasAccessToSpace({
      spaceId,
      userId
    });
    if (error) {
      throw new UserIsNotSpaceMemberError();
    }
  } else {
    const space = await prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId
      },
      select: {
        publicProposals: true
      }
    });

    if (!space.publicProposals) {
      throw new NotFoundError();
    }
  }
  const proposalBlocks = await getBlocks({
    spaceId,
    ids: blockId ? [blockId] : undefined
  });

  return res.status(200).json(proposalBlocks);
}

async function updateProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalBlockWithTypedFields[]>) {
  const userId = req.session.user.id;
  const data = req.body as ProposalBlockUpdateInput[];
  const spaceId = req.query.id as string;

  const proposalBlocks = await upsertBlocks({
    blocksData: data,
    userId,
    spaceId
  });

  return res.status(200).json(proposalBlocks);
}

async function deleteProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const userId = req.session.user.id;
  const data = req.body as string[];

  await deleteBlocks({
    blocksData: data,
    userId,
    spaceId: req.query.id as string
  });

  return res.status(200).json(data);
}

export default withSessionRoute(handler);
