import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProjectController);

async function getProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers | null>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      page: {
        select: {
          id: true
        }
      },
      project: {
        include: {
          projectMembers: true
        }
      }
    }
  });

  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const pagePermissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: proposal.page!.id,
    userId
  });

  if (!pagePermissions.read) {
    throw new ActionNotPermittedError('You do not have permission to view this proposal');
  }

  const projectWithMembers = proposal.project as ProjectWithMembers | null;

  return res.status(200).json(projectWithMembers);
}

export default withSessionRoute(handler);
