import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DocusignEnvelopeLite, DocusignSearchParams } from '@packages/lib/docusign/api';
import { searchDocusignDocs } from '@packages/lib/docusign/api';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { checkHasProposalLegalDocsAccess } from '@packages/lib/proposals/documentsToSign/checkHasProposalLegalDocsAccess';
import { withSessionRoute } from '@packages/lib/session/withSession';

export type DocusignSearchRequest = DocusignSearchParams & {
  proposalId: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys([{ key: 'proposalId', valueType: 'uuid' }], 'query'))
  .get(searchDocusign);

async function searchDocusign(req: NextApiRequest, res: NextApiResponse<DocusignEnvelopeLite[]>) {
  const proposalId = req.query.proposalId as string;

  await checkHasProposalLegalDocsAccess({
    userId: req.session.user.id,
    proposalId
  });

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      spaceId: true
    }
  });

  const envelopes = await searchDocusignDocs({
    spaceId: proposal.spaceId,
    query: req.query
  });

  return res.status(200).json(envelopes);
}

export default withSessionRoute(handler);
