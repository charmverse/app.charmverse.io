import type { NextApiRequestWithApiPageKey } from '@packages/lib/middleware/requireApiPageKey';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiResponse } from 'next';

import type { PageProperty } from 'lib/public-api';
import { createDatabaseCardPage } from 'lib/public-api';
import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';
import { apiPageKeyHandler } from 'lib/public-api/handler';
import { updateDatabaseSchema } from 'lib/public-api/updateDatabaseSchema';
import type { BodyFormResponse, TypeformResponse } from 'lib/typeform/interfaces';
import { simplifyTypeformResponse } from 'lib/typeform/simplifyTypeformResponse';
import { transformWebhookBodyFormResponse } from 'lib/typeform/transformWebhookBodyFormResponse';

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

  // Eval if an existing property was changed
  function evalPropertyChanged(prop: PageProperty): boolean {
    if (prop.type !== 'select' && prop.type !== 'multiSelect') {
      return false;
    }

    const matched = board.schema.find((s) => s.id === prop.id);

    // This is a new property
    if (!matched) {
      return true;
    } else if (prop.options?.length !== matched.options?.length) {
      return true;
    } else if (
      prop.options?.some((o) => {
        return !matched.options?.map((opt) => opt.value).includes(o.value);
      })
    ) {
      return true;
    } else {
      return false;
    }
  }

  const shouldUpdateProperties =
    allProperties.length !== board.schema.length || allProperties.some(evalPropertyChanged);

  if (shouldUpdateProperties) {
    await updateDatabaseSchema({ boardId: board.id, properties: allProperties });
  }

  const reduced = updatedBody.reduce(
    (acc, val) => {
      acc[val.question.id] = val.answer;
      return acc;
    },
    {} as Record<string, any>
  );

  const card = await createDatabaseCardPage({
    title: 'Form Response',
    properties: reduced,
    boardId: board.id,
    spaceId,
    createdBy: apiPageKey.createdBy
  });

  await permissionsApiClient.pages.setupPagePermissionsAfterEvent({
    event: 'created',
    pageId: card.id
  });

  return res.status(201).json(card);
}

export default handler;
