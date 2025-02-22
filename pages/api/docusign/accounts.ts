import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { listSpaceEnvelopes } from 'lib/docusign/api';
import { getSpaceDocusignCredentials } from 'lib/docusign/getSpaceDocusignCredentials';
import { getUserDocusignAccountsInfo } from 'lib/docusign/getUserDocusignAccountsInfo';
import { setSpaceDocusignAccount } from 'lib/docusign/setSpaceDocusignAccount';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(listDocusignAccounts)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId' }))
  .put(requireKeys(['docusignAccountId'], 'body'), updateUsedDocusignAccount);
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

async function listDocusignAccounts(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.spaceId as string;
  const userId = req.session.user.id;
  const { error } = await hasAccessToSpace({ spaceId, userId, adminOnly: true });
  if (error) {
    return res.status(200).json([]);
  }
  const credentials = await getSpaceDocusignCredentials({ spaceId: req.query.spaceId as string });

  const docusignAccounts = await getUserDocusignAccountsInfo({
    accessToken: credentials.accessToken,
    adminOnly: true
  });

  return res.status(200).json(docusignAccounts);
}

async function updateUsedDocusignAccount(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.body.spaceId as string;
  const credentials = await getSpaceDocusignCredentials({ spaceId });

  await setSpaceDocusignAccount({
    docusignAccountId: req.body.docusignAccountId,
    spaceId,
    userId: req.session.user.id
  });

  const docusignAccounts = await getUserDocusignAccountsInfo({
    accessToken: credentials.accessToken,
    adminOnly: true
  });

  return res.status(200).json(docusignAccounts);
}

export default withSessionRoute(handler);
