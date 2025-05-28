import { requireSpaceMembership } from '@packages/lib/middleware';
import { defaultHandler } from '@packages/lib/middleware/handler';
import { archiveWorkflowTemplate } from '@packages/lib/proposals/workflows/archiveWorkflowTemplate';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = defaultHandler();

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).put(archiveWorkflowController);

async function archiveWorkflowController(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const workflowId = req.body.workflowId;

  if (typeof workflowId !== 'string') {
    throw new InvalidInputError(`workflowId is required`);
  }

  await archiveWorkflowTemplate({ spaceId, workflowId });

  return res.status(200).end();
}

export default withSessionRoute(handler);
