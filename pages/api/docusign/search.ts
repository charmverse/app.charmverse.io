import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DocusignEnvelope } from 'lib/docusign/api';
import { searchDocusignDocs } from 'lib/docusign/api';
import type { PublicDocuSignProfile } from 'lib/docusign/authentication';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, location: 'query', spaceIdKey: 'spaceId' })).get(searchDocusign);

async function searchDocusign(req: NextApiRequest, res: NextApiResponse<DocusignEnvelope[]>) {
  const envelopes = await searchDocusignDocs({
    spaceId: req.query.spaceId as string,
    ...req.query
  });

  return res.status(200).json(envelopes);
}

export default withSessionRoute(handler);
