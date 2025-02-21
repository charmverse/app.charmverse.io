import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSpacePropertyValues } from 'lib/members/getSpacePropertyValues';
import type { PropertyValue, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import { updateMemberPropertyValues } from 'lib/members/updateMemberPropertyValues';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .get(getMemberValuesHandler)
  .put(updateMemberPropertyValuesHandler);

async function getMemberValuesHandler(req: NextApiRequest, res: NextApiResponse<PropertyValue[]>) {
  const userId = req.session.user.id;
  const memberId = req.query.memberId as string;
  const spaceId = req.query.spaceId as string | undefined;

  if (!memberId || !spaceId) {
    throw new InvalidInputError('Please provide proper member and space information');
  }

  const propertyValues = await getSpacePropertyValues({ memberId, requestingUserId: userId, spaceId });

  return res.status(200).json(propertyValues);
}

async function updateMemberPropertyValuesHandler(req: NextApiRequest, res: NextApiResponse<PropertyValue[]>) {
  const userId = req.session.user.id;
  const memberId = req.query.memberId as string;
  const spaceId = req.query.spaceId as string;

  if (!memberId || !spaceId) {
    throw new InvalidInputError('Please provide proper member and space information');
  }

  if (memberId !== userId) {
    const { error } = await hasAccessToSpace({ userId, spaceId, adminOnly: true });
    if (error) {
      throw error;
    }
  }

  const data = req.body as UpdateMemberPropertyValuePayload[];

  const updatedPropertyValues = await updateMemberPropertyValues({
    userId: memberId,
    spaceId,
    updatedBy: userId,
    data
  });

  return res.status(200).json(updatedPropertyValues);
}

export default withSessionRoute(handler);
