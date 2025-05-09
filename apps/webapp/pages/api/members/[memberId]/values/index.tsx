import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSpacesPropertyValues } from '@packages/lib/members/getSpacesPropertyValues';
import type { MemberPropertyValuesBySpace } from '@packages/lib/members/interfaces';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getMemberValuesHandler);

async function getMemberValuesHandler(req: NextApiRequest, res: NextApiResponse<MemberPropertyValuesBySpace[]>) {
  const userId = req.session.user?.id;
  const memberId = req.query.memberId;

  if (!memberId || typeof memberId !== 'string') {
    throw new InvalidInputError('Please provide proper member and workspace information');
  }

  const propertyValues = await getSpacesPropertyValues({ memberId, requestingUserId: userId });

  return res.status(200).json(propertyValues);
}

export default withSessionRoute(handler);
