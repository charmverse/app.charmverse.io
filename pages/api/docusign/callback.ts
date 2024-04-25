import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { Frame } from 'frames.js';
import { getFrame } from 'frames.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import * as http from 'adapters/http';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { isLocalhostUrl, prettyPrint } from 'lib/utils/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(docusignCallback);

async function docusignCallback(req: NextApiRequest, res: NextApiResponse) {
  prettyPrint({ query: req.query, body: req.body });

  return res.status(200).json({ message: 'Docusign callback' });
}

export default withSessionRoute(handler);
