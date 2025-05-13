import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { listSpaceEnvelopes } from '@packages/lib/docusign/api';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' })).get(listEnvelopesController);
// .post(requireKeys(['signers', 'templateId'], 'body'), createEnvelopeController);

// async function createEnvelopeController(req: NextApiRequest, res: NextApiResponse) {
//   const credentials = await getSpaceDocusignCredentials({
//     spaceId: req.query.spaceId as string
//   });

//   const envelope = await createEnvelope({
//     accountId: credentials.docusignAccountId,
//     apiBaseUrl: credentials.docusignApiBaseUrl,
//     authToken: credentials.accessToken,
//     spaceId: credentials.spaceId,
//     templateId: req.body.templateId,
//     signers: req.body.signers
//   });

//   return res.status(200).json(envelope);
// }

async function listEnvelopesController(req: NextApiRequest, res: NextApiResponse) {
  const envelopes = await listSpaceEnvelopes({
    spaceId: req.query.spaceId as string
  });

  return res.status(200).json(envelopes);
}

export default withSessionRoute(handler);
