import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { deleteBlocks } from '@packages/lib/rewards/blocks/deleteBlocks';
import { getBlocks } from '@packages/lib/rewards/blocks/getBlocks';
import type { RewardBlockUpdateInput, RewardBlockWithTypedFields } from '@packages/lib/rewards/blocks/interfaces';
import { upsertBlocks } from '@packages/lib/rewards/blocks/upsertBlocks';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getRewardBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .put(updateRewardBlocksHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .delete(deleteRewardBlocksHandler);

async function getRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<RewardBlockWithTypedFields[]>) {
  const spaceId = req.query.id as string;
  const blockId = req.query.blockId as string;
  const type = req.query.type as 'board' | 'card' | 'view' | undefined;

  const rewardBlocks = await getBlocks({
    spaceId,
    type,
    ids: blockId ? [blockId] : undefined
  });

  return res.status(200).json(rewardBlocks);
}

async function updateRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<RewardBlockWithTypedFields[]>) {
  const userId = req.session.user.id;
  const data = req.body as RewardBlockUpdateInput[];
  const spaceId = req.query.id as string;

  const rewardBlocks = await upsertBlocks({
    blocksData: data,
    userId,
    spaceId
  });

  relay.broadcast(
    {
      type: 'reward_blocks_updated',
      payload: rewardBlocks
    },
    spaceId
  );

  return res.status(200).json(rewardBlocks);
}

async function deleteRewardBlocksHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const userId = req.session.user.id;
  const blockIds = typeof req.query.blockIds === 'string' ? [req.query.blockIds] : req.query.blockIds;

  await deleteBlocks({
    blocksData: blockIds || [],
    userId,
    spaceId: req.query.id as string
  });

  return res.status(200).json(blockIds || []);
}

export default withSessionRoute(handler);
