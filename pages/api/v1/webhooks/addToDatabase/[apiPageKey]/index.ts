import fs from 'node:fs/promises';
import path from 'node:path';

import type { NextApiResponse } from 'next';

import type { NextApiRequestWithApiPageKey } from 'lib/middleware/requireApiPageKey';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { createDatabaseCardPage } from 'lib/public-api';
import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';
import { apiPageKeyHandler } from 'lib/public-api/handler';
import { updateDatabaseSchema } from 'lib/public-api/updateDatabaseSchema';
import type { BodyFormResponse, TypeformResponse } from 'lib/typeform/interfaces';
import { simplifyTypeformResponse } from 'lib/typeform/simplifyTypeformResponse';
import { transformWebhookBodyFormResponse } from 'lib/typeform/transformWebhookBodyFormResponse';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = apiPageKeyHandler();

handler.post(createFormResponse);

// Unused endpoint, keeping it here for reference but removing from docs
// /**
//  * @swagger
//  * /databases/{databaseId}/{key}:
//  *   post:
//  *     summary: Create a new form response in the database from an external service.
//  *     description: Create a new form response with array of questions and answers.
//  *     requestBody:
//  *       content:
//  *          application/json:
//  *             schema:
//  *               oneOf:
//  *                  - type: object
//  *                    properties:
//  *                       all_responses:
//  *                          type: string
//  *                  - type: string
//  *     responses:
//  *       200:
//  *         description: Summary of the database
//  *         content:
//  *            application/json:
//  *              schema:
//  *                $ref: '#/components/schemas/Page'
//  */
export async function createFormResponse(req: NextApiRequestWithApiPageKey, res: NextApiResponse) {
  const apiPageKey = req.apiPageKey;
  let body: BodyFormResponse = [];

  // await fs.writeFile(path.resolve(`jsonoutputs/createFormResponse.json`), JSON.stringify(req.body, null, 2), 'utf-8');

  if (req.apiPageKey.type === 'typeform' && req.body.form_response) {
    const payload = { ...req.body.form_response } as TypeformResponse;
    body = simplifyTypeformResponse(payload);
  }

  const spaceId = apiPageKey.page.spaceId;
  const databaseId = apiPageKey.pageId;
  const board = await getDatabaseWithSchema({ spaceId, databaseId });

  if (!board) {
    throw new InvalidInputError('Database not found');
  }
  // Transform body questions and answers into card properties
  const { updatedBody, allProperties } = transformWebhookBodyFormResponse(body, board.schema);

  if (allProperties.length !== board.schema.length) {
    await updateDatabaseSchema({ boardId: board.id, properties: allProperties });
  }

  const reduced = updatedBody.reduce((acc, val) => {
    acc[val.question.id] = val.answer;
    return acc;
  }, {} as Record<string, any>);

  const card = await createDatabaseCardPage({
    title: 'Form Response',
    properties: reduced,
    boardId: board.id,
    spaceId,
    createdBy: apiPageKey.createdBy
  });

  await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
    event: 'created',
    pageId: card.id
  });

  return res.status(201).json(card);
}

export default handler;
