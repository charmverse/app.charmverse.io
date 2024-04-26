import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getPersonaInquiryDetails } from 'lib/kyc/persona/getPersonaInquiryDetails';
import type { PersonaInquiry } from 'lib/kyc/persona/interfaces';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['userId'], 'query'))
  .get(getPersonaSession);

async function getPersonaSession(req: NextApiRequest, res: NextApiResponse<PersonaInquiry | null>) {
  const spaceId = req.query.id as string;
  const userId = req.query.userId as string;

  const data = await getPersonaInquiryDetails(spaceId, userId);

  res.status(200).json(data);
}

export default withSessionRoute(handler);
