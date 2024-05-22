import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getProposalDocumentsHandler)
  .post(addProposalDocumentHandler)
  .delete(removeProposalDocumentHandler);

async function getProposalDocumentsHandler(req: NextApiRequest, res: NextApiResponse) {
  const { evaluationId } = req.query;

  const evaluation = await prisma.proposalEvaluation.findFirstOrThrow({
    where: {
      id: evaluationId as string
    },
    select: {
      proposalId: true,
      proposal: {
        select: {
          authors: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: evaluation.proposalId,
    userId: req.session.user.id
  });

  // Only people with evaluate permission, or authors, can view the document details
  if (
    !proposalPermissions.evaluate &&
    !evaluation.proposal.authors.some((author) => author.userId === req.session.user.id)
  ) {
    throw new ActionNotPermittedError('You do not have permission to view documents for this proposal');
  }

  const documents = await prisma.documentToSign.findMany({
    where: {
      evaluationId: req.query.id as string
    }
  });
  return res.status(200).json(documents);
}

async function addProposalDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add your logic for adding a proposal document here
  return res.status(200).json({ message: 'Proposal document added successfully' });
}

async function removeProposalDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add your logic for removing a proposal document here
  return res.status(200).json({ message: 'Proposal document removed successfully' });
}

export default withSessionRoute(handler);
