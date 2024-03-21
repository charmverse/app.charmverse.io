import type { ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { addProjectMember } from 'lib/projects/addProjectMember';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(addProjectMemberController);

async function addProjectMemberController(req: NextApiRequest, res: NextApiResponse<ProjectMember>) {
  const projectId = req.query.id as string;
  const projectLead = await prisma.projectMember.findFirst({
    where: {
      teamLead: true,
      projectId,
      userId: req.session.user.id
    }
  });

  if (!projectLead) {
    throw new ActionNotPermittedError('Only team lead can add project members');
  }

  const projectMember = await addProjectMember({
    projectId,
    userId: req.session.user.id
  });
  return res.status(201).json(projectMember);
}

export default withSessionRoute(handler);
