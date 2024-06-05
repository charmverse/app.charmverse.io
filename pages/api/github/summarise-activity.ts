import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DeveloperActivity, LitePullRequestSummary } from 'lib/github/summariseDeveloperActivity';
import { summariseDeveloperActivity } from 'lib/github/summariseDeveloperActivity';
import type { PullRequestSummaryWithFilePatches } from 'lib/github/summarisePullRequest';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { requireConnectorKey } from 'lib/middleware/requireConnectorKey';
import { prettyPrint } from 'lib/utils/strings';

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

  prettyPrint({ summaries });

  res.status(200).json(summaries);
}

export default handler;
