import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProjectAndMembersPayload, ProjectWithMembers } from 'lib/projects/interfaces';
import { updateProjectAndMembers } from 'lib/projects/updateProjectAndMembers';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateProjectController);

async function updateProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers>) {
  const projectUpdatePayload = req.body as ProjectAndMembersPayload;
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

  const updatedProjectWithMembers = await updateProjectAndMembers({
    userId: req.session.user.id,
    projectId,
    payload: projectUpdatePayload
  });

  return res.status(201).json(updatedProjectWithMembers);
}

export default withSessionRoute(handler);
