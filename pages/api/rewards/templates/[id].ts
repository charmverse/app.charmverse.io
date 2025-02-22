import { hasAccessToSpace } from '@charmverse/core/permissions';
import { NotFoundError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getRewardTemplate } from 'lib/rewards/getRewardTemplate';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplate';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getRewardTemplatesController);

async function getRewardTemplatesController(req: NextApiRequest, res: NextApiResponse<RewardTemplate>) {
  const userId = req.session.user?.id;
  const pageId = req.query.id as string;
  const template = await getRewardTemplate({ pageId });

  const { isAdmin } = await hasAccessToSpace({
    spaceId: template.spaceId,
    userId
  });

  if (template.status === 'draft' && !isAdmin) {
    throw new NotFoundError();
  }

  return res.status(200).json(template);
}

export default withSessionRoute(handler);
