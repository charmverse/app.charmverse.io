import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { deleteProjectMember } from 'lib/projects/deleteProjectMember';
import type { ProjectValues, ProjectWithMembers } from 'lib/projects/interfaces';
import { updateProjectMember } from 'lib/projects/updateProjectMember';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteProjectMemberController).put(updateProjectMemberController);

async function updateProjectMemberController(
  req: NextApiRequest,
  res: NextApiResponse<ProjectWithMembers['projectMembers'][number]>
) {
  const userId = req.session.user.id;
  const projectMemberId = req.query.memberId as string;
  await prisma.projectMember.findFirstOrThrow({
    where: {
      id: projectMemberId,
      userId
    }
  });
  const projectMemberValues = req.body as ProjectValues['projectMembers'][0];

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

  const isUserProjectLead = project.projectMembers.find((member) => member.userId === userId)?.teamLead;
  const isUserProjectMember = project.projectMembers.find((member) => member.userId === userId);

  if (!isUserProjectLead && !isUserProjectMember) {
    throw new ActionNotPermittedError('You are not allowed to delete project member');
  }

  await deleteProjectMember({
    projectMemberId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
