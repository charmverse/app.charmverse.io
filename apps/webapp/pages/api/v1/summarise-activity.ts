import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DeveloperActivity } from '@packages/lib/github/summariseDeveloperActivity';
import { summariseDeveloperActivity } from '@packages/lib/github/summariseDeveloperActivity';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { requireConnectorKey } from '@packages/lib/middleware/requireConnectorKey';

const handler = nc({
  onError,
  onNoMatch
});

handler
  .use(requireConnectorKey)
  .use(requireKeys(['githubUsername'], 'body'))
  .post(summariseDeveloperActivityController);

async function summariseDeveloperActivityController(req: NextApiRequest, res: NextApiResponse<DeveloperActivity>) {
  const summaries = await summariseDeveloperActivity({
    githubUsername: req.body.githubUsername,
    limit: req.body.limit,
    fromDate: req.body.fromDate
  });

  res.status(200).json(summaries);
}

export default handler;
