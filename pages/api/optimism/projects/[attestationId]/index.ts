import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import type { OPProjectData } from 'lib/optimism/getOpProjects';
import { getOpProjectsByAttestationId } from 'lib/optimism/getOpProjectsByAttestationId';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProjectByAttestationIdController);

async function getProjectByAttestationIdController(req: NextApiRequest, res: NextApiResponse<OPProjectData | null>) {
  const attestationId = req.query.attestationId as string;
  const opProject = await getOpProjectsByAttestationId({ attestationId });
  return res.status(200).json(opProject);
}

export default handler;
