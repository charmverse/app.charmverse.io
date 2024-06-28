import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PublicDocuSignProfile } from 'lib/docusign/authentication';
import { getSpaceDocusignCredentials } from 'lib/docusign/getSpaceDocusignCredentials';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, location: 'query', spaceIdKey: 'spaceId' }))
  .get(docusignProfile);

async function docusignProfile(req: NextApiRequest, res: NextApiResponse<PublicDocuSignProfile | null>) {
  const credentials = await getSpaceDocusignCredentials({
    spaceId: req.query.spaceId as string
  });

  return res.status(200).json({
    docusignAccountId: credentials.docusignAccountId,
    docusignAccountName: credentials.docusignAccountName,
    spaceId: credentials.spaceId
  });
}

export default withSessionRoute(handler);
