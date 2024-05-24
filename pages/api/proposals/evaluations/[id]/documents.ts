import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import {
  addEnvelopeToEvaluation,
  type EvaluationDocumentToSign
} from 'lib/proposals/documentsToSign/addEnvelopeToEvaluation';
import { checkUserHasEditLegalDocumentAccess } from 'lib/proposals/documentsToSign/checkUserHasEditLegalDocumentAccess';
import { removeEnvelopeFromEvaluation } from 'lib/proposals/documentsToSign/removeEnvelopeFromEvaluation';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<EvaluationDocumentToSign>(['envelopeId']))
  .post(addProposalDocumentHandler)
  .delete(removeProposalDocumentHandler);

async function addProposalDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const envelopeId = req.body.envelopeId;

  const hasAccess = await checkUserHasEditLegalDocumentAccess({
    userId: req.session.user.id,
    evaluationId: req.query.id as string
  });

  if (!hasAccess) {
    throw new ActionNotPermittedError('You do not have permission to add document to sign to this proposal');
  }

  await addEnvelopeToEvaluation({
    envelopeId,
    evaluationId
  });

  // TODO: Add your logic for adding a proposal document here
  return res.status(200).end();
}

async function removeProposalDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const envelopeId = req.query.envelopeId as string;

  const hasAccess = await checkUserHasEditLegalDocumentAccess({
    userId: req.session.user.id,
    evaluationId
  });

  if (!hasAccess) {
    throw new ActionNotPermittedError('You do not have permission to add document to sign to this proposal');
  }

  await removeEnvelopeFromEvaluation({
    envelopeId,
    evaluationId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
