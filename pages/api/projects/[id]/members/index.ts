import type { ProjectMember } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { AddProjectMemberPayload } from 'lib/projects/addProjectMember';
import { addProjectMember } from 'lib/projects/addProjectMember';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(addProjectMemberController);

async function addProjectMemberController(req: NextApiRequest, res: NextApiResponse<ProjectMember>) {
  const projectMemberPayload = req.body as AddProjectMemberPayload;
  const projectId = req.query.id as string;
  const createdProjectMember = await addProjectMember({
    projectId,
    payload: projectMemberPayload,
    userId: req.session.user.id
  });
  trackUserAction('add_project_member', {
    userId: req.session.user.id,
    projectId,
    connectedUserId: createdProjectMember.userId ?? undefined,
    email: projectMemberPayload.email,
    walletAddress: projectMemberPayload.walletAddress
  });
  return res.status(201).json(createdProjectMember);
}

export default withSessionRoute(handler);
