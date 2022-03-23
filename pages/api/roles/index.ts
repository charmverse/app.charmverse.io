
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Role } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IEventToLog, postToDiscord } from 'lib/logs/notifyDiscord';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership)
  .post(createRole);

async function createRole (req: NextApiRequest, res: NextApiResponse<Role>) {
  const data = req.body as Prisma.RoleCreateInput;
  const role = await prisma.role.create({ data });

  return res.status(200).json(role);
}

export default withSessionRoute(handler);
