import { log } from '@charmverse/core/log';
import { charmverseProjectDataChainId } from '@root/lib/credentials/constants';
import { storeCharmverseProjectMetadata } from '@root/lib/credentials/reputation/storeCharmverseProjectMetadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { createProject } from 'lib/projects/createProject';
import { getProjectsByUserId } from 'lib/projects/getProjectsByUserId';
import type { ProjectWithMembers, ProjectAndMembersPayload } from 'lib/projects/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createProjectController).get(getProjectsController);

async function createProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers>) {
  const projectAndMembersPayload = req.body as ProjectAndMembersPayload;
  const createdProjectWithMembers = await createProject({
    userId: req.session.user.id,
    project: projectAndMembersPayload
  });

  await storeCharmverseProjectMetadata({
    chainId: charmverseProjectDataChainId,
    projectId: createdProjectWithMembers.id
  }).catch((err) => {
    log.error('Failed to store charmverse project metadata', {
      err,
      projectId: createdProjectWithMembers.id,
      userId: req.session.user.id
    });
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
