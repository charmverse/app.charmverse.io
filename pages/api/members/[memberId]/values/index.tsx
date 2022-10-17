import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getSpacesPropertyValues } from 'lib/members/getSpacesPropertyValues';
import type { MemberPropertyValuesBySpace } from 'lib/members/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getMemberValuesHandler);

async function getMemberValuesHandler (req: NextApiRequest, res: NextApiResponse<MemberPropertyValuesBySpace[]>) {
  const userId = req.session.user?.id;
  const memberId = req.query.memberId as string;

  if (!memberId) {
    throw new InvalidInputError('Please provide proper member and worspace information');
  }

  const propertyValues = await getSpacesPropertyValues({ memberId, requestingUserId: userId });

  return res.status(200).json(propertyValues);
}

export default withSessionRoute(handler);
