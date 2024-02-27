import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireSpaceMembership } from 'lib/middleware';
import { defaultHandler } from 'lib/middleware/handler';
import {
  getWorkflowTemplates,
  upsertWorkflowTemplate,
  deleteWorkflowTemplate
} from 'lib/proposals/workflows/controller';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utils/errors';

const handler = defaultHandler();

handler
  .get(getWorkflowsController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(upsertWorkflowController)
  .delete(deleteWorkflowController);

async function getWorkflowsController(req: NextApiRequest, res: NextApiResponse<ProposalWorkflowTyped[]>) {
  const spaceId = req.query.id as string;

  const workflows = await getWorkflowTemplates(spaceId);

  return res.status(200).json(workflows);
}

async function deleteWorkflowController(req: NextApiRequest, res: NextApiResponse<ProposalWorkflowTyped[]>) {
  const spaceId = req.query.id as string;
  const workflowId = req.query.workflowId;
  if (typeof workflowId !== 'string') {
    throw new InvalidInputError(`workflowId is required`);
  }

  await deleteWorkflowTemplate({ spaceId, workflowId });

  return res.status(200).end();
}

async function upsertWorkflowController(req: NextApiRequest, res: NextApiResponse<ProposalWorkflowTyped[]>) {
  const workflow = req.body;
  if (typeof workflow?.id !== 'string') {
    throw new InvalidInputError(`workflowId is required`);
  }
  if (workflow?.spaceId !== req.query.id) {
    throw new InvalidInputError(`spaceId is missing or invalid`);
  }

  await upsertWorkflowTemplate(workflow);

  return res.status(200).end();
}

export default withSessionRoute(handler);
