import { log } from '@charmverse/core/log';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { zipContent } from '@packages/lib/utils/file';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { exportSpaceData } from 'lib/templates/exportSpaceData';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(requireSpaceMembership({ adminOnly: true }), requestZip);

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const exportedData = await exportSpaceData({ spaceIdOrDomain: req.query.id as string });

  const compressed = await zipContent({ csv: exportedData.csv, pages: exportedData.pages });

  return res.status(200).setHeader('Content-Type', 'application/octet-stream').send(compressed);
}

export default withSessionRoute(handler);
