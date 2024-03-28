import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProjectWithMembers, ProjectValues } from 'lib/projects/interfaces';
import { updateProject } from 'lib/projects/updateProject';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateProjectController);

async function updateProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers>) {
  const projectUpdatePayload = req.body as ProjectValues;
  const projectId = req.query.id as string;
  const projectLead = await prisma.projectMember.findFirst({
    where: {
      teamLead: true,
      projectId,
      userId: req.session.user.id
    }
  });

  if (!projectLead) {
    throw new ActionNotPermittedError('Only team lead can update project');
  }

  const updatedProjectWithMembers = await updateProject({
    userId: req.session.user.id,
    projectId,
    payload: projectUpdatePayload
  });
  return res.status(201).json(updatedProjectWithMembers);
}

export default withSessionRoute(handler);
