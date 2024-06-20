import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { OPProjectData } from 'lib/optimism/getOpProjects';
import { importOpProject } from 'lib/projects/importOpProject';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(importOpProjectController);

export type ImportOpProjectPayload = {
  attestationUid: string;
  name: string;
  description: string;
  twitter: string;
  website: string;
  externalLink: string;
  team: OPProjectData['team'];
};

async function importOpProjectController(req: NextApiRequest, res: NextApiResponse<ProjectWithMembers>) {
  const userId = req.session.user.id;
  const opProject = req.body as ImportOpProjectPayload;

  const importedProject = await importOpProject(opProject, userId);
  return res.status(200).json(importedProject);
}

export default withSessionRoute(handler);
