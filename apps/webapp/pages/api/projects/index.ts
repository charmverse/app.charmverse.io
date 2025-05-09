import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { createProject } from '@packages/lib/projects/createProject';
import { getProjectsByUserId } from '@packages/lib/projects/getProjectsByUserId';
import type { ProjectAndMembersPayload, ProjectWithMembers } from '@packages/lib/projects/interfaces';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProjectController).get(getProjectsController);

async function createProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers>) {
  const projectAndMembersPayload = req.body as ProjectAndMembersPayload;
  const createdProjectWithMembers = await createProject({
    userId: req.session.user.id,
    project: projectAndMembersPayload
  });

  trackUserAction('add_project', { userId: req.session.user.id, name: projectAndMembersPayload.name });
  return res.status(201).json(createdProjectWithMembers);
}

async function getProjectsController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers[]>) {
  const userId = req.session.user.id;
  const projectsWithMembers = await getProjectsByUserId({ userId });
  return res.status(200).json(projectsWithMembers);
}

export default withSessionRoute(handler);
