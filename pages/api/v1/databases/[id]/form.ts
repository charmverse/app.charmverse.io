import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, requireKeys } from 'lib/middleware';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import type { Page } from 'lib/public-api';
import { validateCreationData, DatabasePageNotFoundError, createDatabaseCardPage } from 'lib/public-api';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';
import type { AddFormResponseInput } from 'lib/zapier/interfaces';
import { parseFormData } from 'lib/zapier/parseFormData';
import { validateFormRequestInput } from 'lib/zapier/validateFormRequestInput';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(requireKeys(['all_responses'], 'body'))
  .post(createFormResponse);

/**
 * @swagger
 * /databases/{databaseId}/pages:
 *   post:
 *     summary: Create a new page in the database
 *     description: Create a new page with a title and any set of values from the custom properties in your database.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/PageQuery'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
export async function createFormResponse(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const spaceId = req.authorizedSpaceId;
  const body: AddFormResponseInput = req.body;

  await validateFormRequestInput({ spaceId, databaseId: id as string, data: body });
  const formResponses = parseFormData(req.body);
  console.log('🔥qqq', formResponses);

  const card = await createDatabaseCardPage({
    ...req.body,
    boardId: id,
    spaceId,
    createdBy: req.botUser.id
  });

  return res.status(201).json({} as any);
}

export default handler;
