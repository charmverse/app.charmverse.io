import type { NextApiRequest, NextApiResponse } from 'next';

import { requireSpaceMembership } from 'lib/middleware';
import { defaultHandler } from 'lib/middleware/handler';
import type { WorkflowTemplate } from 'lib/proposal/workflows/config';
import {
  getWorkflowTemplates,
  updateWorkflowTemplate,
  deleteWorkflowTemplate
} from 'lib/proposal/workflows/controller';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = defaultHandler();

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getWorkflowsController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(updateWorkflowController)
  .delete(deleteWorkflowController);

async function getWorkflowsController(req: NextApiRequest, res: NextApiResponse<WorkflowTemplate[]>) {
  const spaceId = req.query.id as string;

  const workflows = await getWorkflowTemplates(spaceId);

  return res.status(200).json(workflows);
}

async function deleteWorkflowController(req: NextApiRequest, res: NextApiResponse<WorkflowTemplate[]>) {
  const spaceId = req.query.id as string;
  const workflowId = req.query.workflowId;
  if (typeof workflowId !== 'string') {
    throw new InvalidInputError(`workflowId is required`);
  }

  await deleteWorkflowTemplate({ spaceId, workflowId });

  return res.status(200).end();
}

async function updateWorkflowController(req: NextApiRequest, res: NextApiResponse<WorkflowTemplate[]>) {
  const workflow = req.body;
  if (typeof workflow?.id !== 'string') {
    throw new InvalidInputError(`workflowId is required`);
  }
  if (workflow?.spaceId !== req.query.id) {
    throw new InvalidInputError(`spaceId is missing or invalid`);
  }

  await updateWorkflowTemplate(workflow);

  return res.status(200).end();
}

export default withSessionRoute(handler);
