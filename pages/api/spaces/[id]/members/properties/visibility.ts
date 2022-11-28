import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { UpdateMemberPropertyVisibilityPayload } from 'lib/members/interfaces';
import { updateMemberPropertyVisibility } from 'lib/members/updateMemberPropertyVisibility';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).put(updateMemberPropertyVisibilityHandler);

async function updateMemberPropertyVisibilityHandler(req: NextApiRequest, res: NextApiResponse<{ success: 'ok' }>) {
  const payload = req.body as UpdateMemberPropertyVisibilityPayload;

  await updateMemberPropertyVisibility(payload);

  return res.status(201).json({ success: 'ok' });
}

export default withSessionRoute(handler);
