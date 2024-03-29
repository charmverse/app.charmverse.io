import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { createProject } from 'lib/projects/createProject';
import { getProjects } from 'lib/projects/getProjects';
import type { ProjectWithMembers, ProjectValues } from 'lib/projects/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProjectController).get(getProjectsController);

async function createProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers>) {
  const projectPayload = req.body as ProjectValues;
  const createdProjectWithMembers = await createProject({ userId: req.session.user.id, project: projectPayload });
  trackUserAction('add_project', { userId: req.session.user.id, name: projectPayload.name });
  return res.status(201).json(createdProjectWithMembers);
}

async function getProjectsController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers[]>) {
  const userId = req.session.user.id;
  const projectsWithMembers = await getProjects({ userId });
  return res.status(200).json(projectsWithMembers);
}

export default withSessionRoute(handler);
