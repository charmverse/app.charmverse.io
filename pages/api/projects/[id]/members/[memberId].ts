import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { deleteProjectMember } from 'lib/projects/deleteProjectMember';
import type { ProjectWithMembers, ProjectValues } from 'lib/projects/interfaces';
import { updateProject } from 'lib/projects/updateProject';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteProjectMemberController);

async function deleteProjectMemberController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const projectId = req.query.id as string;
  const projectMemberId = req.query.memberId as string;
  const projectLead = await prisma.project.findUniqueOrThrow({
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

  const isUserProjectLead = projectLead.projectMembers.find((member) => member.userId === userId)?.teamLead;
  const isUserProjectMember = projectLead.projectMembers.find((member) => member.userId === userId);

  if (!isUserProjectLead && !isUserProjectMember) {
    throw new ActionNotPermittedError('You are not allowed to delete project member');
  }

  await deleteProjectMember({
    projectMemberId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
