import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import {
  addEnvelopeToEvaluation,
  type EvaluationDocumentToSign
} from '@packages/lib/proposals/documentsToSign/addEnvelopeToEvaluation';
import { checkHasProposalLegalDocsAccess } from '@packages/lib/proposals/documentsToSign/checkHasProposalLegalDocsAccess';
import { passDocumentEvaluationStepIfNecessaryOrReopenEvaluation } from '@packages/lib/proposals/documentsToSign/passDocumentEvaluationStepIfNecessaryOrReopenEvaluation';
import { removeEnvelopeFromEvaluation } from '@packages/lib/proposals/documentsToSign/removeEnvelopeFromEvaluation';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<EvaluationDocumentToSign>(['envelopeId']))
  .post(addProposalDocumentHandler)
  .delete(removeProposalDocumentHandler);

async function addProposalDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const envelopeId = req.body.envelopeId;

  await checkHasProposalLegalDocsAccess({
    evaluationId,
    userId: req.session.user.id
  });

  await addEnvelopeToEvaluation({
    envelopeId,
    evaluationId
  });

  await passDocumentEvaluationStepIfNecessaryOrReopenEvaluation({
    evaluationId
  });

  // TODO: Add your logic for adding a proposal document here
  return res.status(200).end();
}

async function removeProposalDocumentHandler(req: NextApiRequest, res: NextApiResponse) {
  const evaluationId = req.query.id as string;
  const envelopeId = req.query.envelopeId as string;

  await checkHasProposalLegalDocsAccess({
    evaluationId,
    userId: req.session.user.id
  });

  await removeEnvelopeFromEvaluation({
    envelopeId,
    evaluationId
  });

  await passDocumentEvaluationStepIfNecessaryOrReopenEvaluation({
    evaluationId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
