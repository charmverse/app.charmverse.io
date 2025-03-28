import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { deleteProjectMember } from 'lib/projects/deleteProjectMember';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import type { UpdateProjectMemberPayload } from 'lib/projects/updateProjectMember';
import { updateProjectMember } from 'lib/projects/updateProjectMember';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteProjectMemberController).put(updateProjectMemberController);

async function updateProjectMemberController(
  req: NextApiRequest,
  res: NextApiResponse<ProjectWithMembers['projectMembers'][number]>
) {
  const userId = req.session.user.id;
  const projectId = req.query.id as string;
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      projectMembers: {
        select: {
          userId: true
        }
      }
    }
  });

  const isProjectMember = project.projectMembers.find((member) => member.userId === userId);

  if (!isProjectMember) {
    throw new ActionNotPermittedError('You are not allowed to update project member');
  }

  const projectMemberValues = req.body as UpdateProjectMemberPayload;

  const projectMember = await updateProjectMember({
    projectMemberValues
  });

  return res.status(200).send(projectMember);
}

async function deleteProjectMemberController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const projectId = req.query.id as string;
  const projectMemberId = req.query.memberId as string;
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    select: {
      projectMembers: {
        select: {
          userId: true,
          teamLead: true
        }
      }
    }
  });

  const isProjectMember = project.projectMembers.find((member) => member.userId === userId);

  if (!isProjectMember) {
    throw new ActionNotPermittedError('You are not allowed to delete project member');
  }

  await deleteProjectMember({
    projectMemberId
  });

  trackUserAction('remove_project_member', { userId, projectId, projectMemberId });

  return res.status(200).end();
}

export default withSessionRoute(handler);
