import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import type { PublicApiPage } from 'lib/public-api/getPageApi';
import { getPageApi } from 'lib/public-api/getPageApi';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireApiKey).get(getPageHandler);

/**
 * @swagger
 * /pages/{pageIdOrPath}:
 *   get:
 *     summary: Find page by ID or path
 *     responses:
 *       200:
 *         description: Page with content and markdown
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
export async function getPageHandler(req: NextApiRequest, res: NextApiResponse<PublicApiPage>) {
  const { pageIdOrPath } = req.query as { pageIdOrPath: string };
  const spaceId = req.authorizedSpaceId;

  const page = await getPageApi({ pageIdOrPath, spaceId });

  return res.status(200).json(page);
}

export default handler;
