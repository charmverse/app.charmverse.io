import type { MemberProperty, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createMemberProperty } from 'lib/members/createMemberProperty';
import { getMemberPropertiesBySpace } from 'lib/members/getMemberPropertiesBySpace';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getMemberPropertiesHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createMemberPropertyHandler);

async function getMemberPropertiesHandler (req: NextApiRequest, res: NextApiResponse<MemberProperty[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  const properties = await getMemberPropertiesBySpace(userId, spaceId);

  return res.status(200).json(properties);
}

async function createMemberPropertyHandler (req: NextApiRequest, res: NextApiResponse<MemberProperty>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;
  const propertyData = req.body as Prisma.MemberPropertyCreateInput;

  const property = await createMemberProperty({
    userId,
    data: {
      ...propertyData,
      space: { connect: { id: spaceId } }
    }
  });

  return res.status(201).json(property);
}

export default withSessionRoute(handler);
