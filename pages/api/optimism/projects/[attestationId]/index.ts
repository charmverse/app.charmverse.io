import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getOpProjectsByAttestationId } from 'lib/optimism/getOpProjectsByAttestationId';

import type { OptimismProjectAttestationContent } from '..';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProjectByAttestationIdController);

async function getProjectByAttestationIdController(
  req: NextApiRequest,
  res: NextApiResponse<OptimismProjectAttestationContent | null>
) {
  const attestationId = req.query.attestationId as string;
  const opProjectAttestation = await getOpProjectsByAttestationId({ projectRefUID: attestationId });
  return res.status(200).json(opProjectAttestation);
}

export default handler;
