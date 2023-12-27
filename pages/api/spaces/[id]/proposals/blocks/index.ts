import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { deleteBlocks } from 'lib/proposal/blocks/deleteBlocks';
import { getBlocks } from 'lib/proposal/blocks/getBlocks';
import type { ProposalBlockUpdateInput, ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';
import { upsertBlocks } from 'lib/proposal/blocks/upsertBlocks';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getProposalBlocksHandler)
  .put(updateProposalBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .delete(deleteProposalBlocksHandler);

async function getProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalBlockWithTypedFields[]>) {
  const spaceId = req.query.id as string;
  const blockId = req.query.blockId as string;

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
