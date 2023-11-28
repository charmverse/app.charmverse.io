import type { NextApiRequest, NextApiResponse } from 'next';

import { requireSpaceMembership } from 'lib/middleware';
import { defaultHandler } from 'lib/middleware/handler';
import { withSessionRoute } from 'lib/session/withSession';
import type { WorkflowTemplate } from 'lib/spaces/getProposalWorkflowTemplates';
import { getWorkflowTemplates } from 'lib/spaces/getProposalWorkflowTemplates';

const handler = defaultHandler();

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getWorkflowsController);

async function getWorkflowsController(req: NextApiRequest, res: NextApiResponse<WorkflowTemplate[]>) {
  const spaceId = req.query.id as string;

  const workflows = await getWorkflowTemplates(spaceId);

  return res.status(200).json(workflows);
}

export default withSessionRoute(handler);
