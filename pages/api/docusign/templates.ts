// import type { NextApiRequest, NextApiResponse } from 'next';
// import nc from 'next-connect';

// import type { DocusignTemplate } from 'lib/docusign/api';
// import { getDocusignTemplates } from 'lib/docusign/api';
// import type { PublicDocuSignProfile } from 'lib/docusign/authentication';
// import { getSpaceDocusignCredentials } from 'lib/docusign/authentication';
// import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
// import { withSessionRoute } from 'lib/session/withSession';

// const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

// handler
//   .use(requireSpaceMembership({ adminOnly: false, location: 'query', spaceIdKey: 'spaceId' }))
//   .get(docusignTemplates);

// async function docusignTemplates(req: NextApiRequest, res: NextApiResponse<DocusignTemplate[]>) {
//   const credentials = await getSpaceDocusignCredentials({
//     spaceId: req.query.spaceId as string
//   });

//   // const spaceId = req.query.spaceId as string;

//   const templates = await getDocusignTemplates({
//     accountId: credentials.docusignAccountId,
//     apiBaseUrl: credentials.docusignApiBaseUrl,
//     authToken: credentials.accessToken
//   });

//   return res.status(200).json(templates);
// }

// export default withSessionRoute(handler);
