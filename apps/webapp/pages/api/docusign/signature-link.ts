// import type { NextApiRequest, NextApiResponse } from 'next';
// import nc from 'next-connect';

// import type { DocusignEnvelopeLinkRequest } from '@packages/lib/docusign/api';
// import { requestEnvelopeSigningLink } from '@packages/lib/docusign/api';
// import { onError, onNoMatch, requireKeys, requireSpaceMembership } from '@packages/lib/middleware';
// import { withSessionRoute } from '@packages/lib/session/withSession';

// const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

// handler
//   .use(requireSpaceMembership({ adminOnly: false, location: 'body', spaceIdKey: 'spaceId' }))
//   .use(requireKeys(['docusignEnvelopeId', 'signerEmail'], 'body'))
//   .post(signingLinkController);

// async function signingLinkController(req: NextApiRequest, res: NextApiResponse) {
//   const url = await requestEnvelopeSigningLink(req.body as DocusignEnvelopeLinkRequest);

//   return res.status(200).json({ url });
// }

// export default withSessionRoute(handler);
