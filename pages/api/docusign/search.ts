import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DocusignEnvelopeLite, DocusignSearchParams } from 'lib/docusign/api';
import { searchDocusignDocs } from 'lib/docusign/api';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { checkUserHasEditLegalDocumentAccess } from 'lib/proposals/documentsToSign/checkUserHasEditLegalDocumentAccess';
import { withSessionRoute } from 'lib/session/withSession';

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

  const hasDocumentAccess = await checkUserHasEditLegalDocumentAccess({
    proposalId,
    userId: req.session.user.id
  });
  if (!hasDocumentAccess) {
    throw new ActionNotPermittedError('You do not have permission to edit documents for this proposal');
  }

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
