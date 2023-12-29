import type { MemberProperty } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deleteMemberProperty } from 'lib/members/deleteMemberProperty';
import { updateMemberProperty } from 'lib/members/updateMemberProperty';
import { InvalidStateError, onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .put(updateMemberPropertyHandler)
  .delete(deleteMemberPropertyHandler);

async function updateMemberPropertyHandler(req: NextApiRequest, res: NextApiResponse<MemberProperty>) {
  const userId = req.session.user.id;
  const propertyId = req.query.propertyId as string;
  const data = req.body as Partial<MemberProperty>;
  const spaceId = req.query.id as string;

  const updatedProperty = await updateMemberProperty({ userId, id: propertyId, data, spaceId });

  return res.status(200).json(updatedProperty);
}

async function deleteMemberPropertyHandler(req: NextApiRequest, res: NextApiResponse) {
  const memberProperty = await deleteMemberProperty(req.query.propertyId as string);
  if (!memberProperty.count) {
    throw new InvalidStateError("Can't delete default member properties");
  }
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
