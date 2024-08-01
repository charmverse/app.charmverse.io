import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { charmverseProjectDataChainId, disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProjectWithMembers, ProjectAndMembersPayload } from 'lib/projects/interfaces';
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

  if (!disableCredentialAutopublish) {
    await storeCharmverseProjectMetadata({
      chainId: charmverseProjectDataChainId,
      projectId: updatedProjectWithMembers.id
    }).catch((err) => {
      log.error('Failed to store charmverse project metadata', {
        err,
        projectId: updatedProjectWithMembers.id,
        userId: req.session.user.id
      });
    });
  }

  return res.status(201).json(updatedProjectWithMembers);
}

export default withSessionRoute(handler);
