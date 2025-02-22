import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { UpdateProjectPayload } from 'lib/projects/updateProject';
import { updateProject } from 'lib/projects/updateProject';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(patchProjectController);

async function patchProjectController(req: NextApiRequest, res: NextApiResponse<Project>) {
  const projectUpdatePayload = req.body as UpdateProjectPayload;
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

  const updatedProject = await updateProject({
    projectValues: {
      ...projectUpdatePayload,
      id: projectId
    }
  });

  return res.status(201).json(updatedProject);
}

export default withSessionRoute(handler);
