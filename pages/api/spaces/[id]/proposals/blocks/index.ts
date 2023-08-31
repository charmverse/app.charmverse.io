import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { createBlocks } from 'lib/proposal/blocks/createBlocks';
import { deleteBlocks } from 'lib/proposal/blocks/deleteBlocks';
import { getBlocks } from 'lib/proposal/blocks/getBlocks';
import type {
  ProposalBlockInput,
  ProposalBlockUpdateInput,
  ProposalBlockWithTypedFields
} from 'lib/proposal/blocks/interfaces';
import { updateBlocks } from 'lib/proposal/blocks/updateBlocks';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getProposalBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createProposalBlocksHandler)
  .put(updateProposalBlocksHandler)
  .delete(deleteProposalBlocksHandler);

async function getProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalBlockWithTypedFields[]>) {
  const spaceId = req.query.id as string;

  const proposalBlocks = await getBlocks({
    spaceId
  });

  return res.status(200).json(proposalBlocks);
}

async function createProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalBlockWithTypedFields[]>) {
  const userId = req.session.user.id;
  const data = req.body as ProposalBlockInput[];

  const proposalBlocks = await createBlocks({
    blocksData: data,
    userId
  });

  return res.status(200).json(proposalBlocks);
}

async function updateProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<ProposalBlockWithTypedFields[]>) {
  const userId = req.session.user.id;
  const data = req.body as ProposalBlockUpdateInput[];

  const proposalBlocks = await updateBlocks({
    blocksData: data,
    userId
  });

  return res.status(200).json(proposalBlocks);
}

async function deleteProposalBlocksHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const userId = req.session.user.id;
  const data = req.body as string[];

  await deleteBlocks({
    blocksData: data,
    userId
  });

  return res.status(200).json(data);
}

export default withSessionRoute(handler);
