import type { MemberProperty } from '@charmverse/core/prisma';
import { Prisma } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createMemberProperty } from '@packages/lib/members/createMemberProperty';
import { getAccessibleMemberPropertiesBySpace } from '@packages/lib/members/getAccessibleMemberPropertiesBySpace';
import type { CreateMemberPropertyPayload } from '@packages/lib/members/interfaces';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getMemberPropertiesHandler)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createMemberPropertyHandler);

async function getMemberPropertiesHandler(req: NextApiRequest, res: NextApiResponse<MemberProperty[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  const properties = await getAccessibleMemberPropertiesBySpace({ requestingUserId: userId, spaceId });

  return res.status(200).json(properties);
}

async function createMemberPropertyHandler(req: NextApiRequest, res: NextApiResponse<MemberProperty>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;
  const propertyData = req.body as CreateMemberPropertyPayload;

  const property = await createMemberProperty({
    userId,
    data: {
      ...propertyData,
      createdBy: userId,
      updatedBy: userId,
      options: propertyData.options ?? Prisma.DbNull,
      space: { connect: { id: spaceId } }
    },
    spaceId
  });

  return res.status(201).json(property);
}

export default withSessionRoute(handler);
