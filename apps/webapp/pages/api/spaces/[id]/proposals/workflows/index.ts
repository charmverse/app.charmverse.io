import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { requireSpaceMembership } from '@packages/lib/middleware';
import { defaultHandler } from '@packages/lib/middleware/handler';
import { deleteWorkflowTemplate } from '@packages/lib/proposals/workflows/deleteWorkflowTemplate';
import { getWorkflowTemplates } from '@packages/lib/proposals/workflows/getWorkflowTemplates';
import { obfuscateWorkflow } from '@packages/lib/proposals/workflows/obfuscateWorkflow';
import { upsertWorkflowTemplate } from '@packages/lib/proposals/workflows/upsertWorkflowTemplate';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = defaultHandler();

handler
  .get(getWorkflowsController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(upsertWorkflowController)
  .delete(deleteWorkflowController);

async function getWorkflowsController(req: NextApiRequest, res: NextApiResponse<ProposalWorkflowTyped[]>) {
  const spaceId = req.query.id as string;

  const workflows = await getWorkflowTemplates(spaceId);

  const { isAdmin } = await hasAccessToSpace({ spaceId, userId: req.session.user?.id });

  if (!isAdmin) {
    for (const workflow of workflows) {
      if (workflow.privateEvaluations) {
        workflow.evaluations = obfuscateWorkflow(workflow);
      }
    }
  }

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

  // Check if the workflow exists and is archived
  const existingWorkflow = await prisma.proposalWorkflow.findUnique({
    where: {
      id: workflow.id
    },
    select: {
      archived: true
    }
  });

  if (existingWorkflow?.archived && workflow.archived !== false) {
    throw new InvalidInputError('Cannot modify archived workflows. Unarchive the workflow first.');
  }

  await upsertWorkflowTemplate(workflow);

  return res.status(200).end();
}

export default withSessionRoute(handler);
