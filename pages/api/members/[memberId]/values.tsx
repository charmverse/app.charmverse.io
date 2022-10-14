import type { MemberProperty, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PropertyValue, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import { updateMemberPropertyValues } from 'lib/members/updateMemberPropertyValues';
import { hasAccessToSpace, onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .put(updateMemberPropertyValuesHandler);

async function updateMemberPropertyValuesHandler (req: NextApiRequest, res: NextApiResponse<PropertyValue[]>) {
  const userId = req.session.user.id;
  const memberId = req.query.memberId as string;
  const spaceId = req.query.spaceId as string;

  if (!memberId || !spaceId) {
    throw new InvalidInputError('Please provide proper member and worspace information');
  }

  if (memberId !== userId) {
    const { error } = await hasAccessToSpace({ userId, spaceId, adminOnly: true });
    if (error) {
      throw error;
    }
  }

  const data = req.body as UpdateMemberPropertyValuePayload[];

  const updatedPropertyValues = await updateMemberPropertyValues({ userId, spaceId, data });

  return res.status(200).json(updatedPropertyValues);
}

export default withSessionRoute(handler);
