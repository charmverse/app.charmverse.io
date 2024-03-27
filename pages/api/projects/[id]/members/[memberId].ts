import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { removeProjectMember } from 'lib/projects/removeProjectMember';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(removeProjectMemberController);

async function removeProjectMemberController(req: NextApiRequest, res: NextApiResponse) {
  const projectId = req.query.id as string;
  const memberId = req.query.memberId as string;

  const projectLead = await prisma.projectMember.findFirst({
    where: {
      teamLead: true,
      projectId,
      userId: req.session.user.id
    }
  });

  if (!projectLead) {
    throw new ActionNotPermittedError('Only team lead can remove project members');
  }

  await removeProjectMember({
    projectId,
    memberId
  });

  return res.status(201).end();
}

export default withSessionRoute(handler);
