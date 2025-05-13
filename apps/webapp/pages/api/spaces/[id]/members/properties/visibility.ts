import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { UpdateMemberPropertyVisibilityPayload } from '@packages/lib/members/interfaces';
import { updateMemberPropertyVisibility } from '@packages/lib/members/updateMemberPropertyVisibility';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).put(updateMemberPropertyVisibilityHandler);

async function updateMemberPropertyVisibilityHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' }>) {
  const payload = req.body as UpdateMemberPropertyVisibilityPayload;

  await updateMemberPropertyVisibility(payload);

  return res.status(201).json({ success: 'ok' });
}

export default withSessionRoute(handler);
