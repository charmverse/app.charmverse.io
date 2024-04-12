import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createPersonaInquiry } from 'lib/kyc/persona/createPersonaInquiry';
import { getPersonaInquiryDetails } from 'lib/kyc/persona/getPersonaInquiryDetails';
import type { PersonaInquiry } from 'lib/kyc/persona/interfaces';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getPersonaSession)
  .post(init);

async function getPersonaSession(req: NextApiRequest, res: NextApiResponse<PersonaInquiry | null>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

  const data = await getPersonaInquiryDetails(spaceId, userId);

  res.status(200).json(data);
}

async function init(req: NextApiRequest, res: NextApiResponse<PersonaInquiry>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id as string;

  const data = await createPersonaInquiry(spaceId, userId);

  res.status(200).json(data);
}

export default withSessionRoute(handler);
