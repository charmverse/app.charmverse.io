
import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireApiKey, requireKeys } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4, validate } from 'uuid';
import { Page, PageProperty, mapProperties, PageFromBlock, validateCreationData } from 'lib/public-api';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(requireKeys<Page>(['title'], 'body'))
  .post(createPage);

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
export async function createPage (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const isValidUuid = validate(id as string);

  const domain = process.env.DOMAIN ?? 'https://app.charmverse.io';

  if (!isValidUuid) {
    throw new ApiError({
      errorType: 'Invalid input',
      message: `Please provide a valid database ID in the request query. Visit ${domain}/api-docs to find out how to get this`
    });
  }

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string,
      spaceId
    }
  });

  if (!board) {
    throw new ApiError({
      message: 'Database not found',
      errorType: 'Data not found'
    });
  }

  const { title, properties } = req.body;

  try {
    validateCreationData(req.body);

  }
  catch (error) {
    return res.status(400).json(error);
  }

  const boardSchema = (board.fields as any).cardProperties as PageProperty [];

  let propertiesToAdd: Record<string, string | number> = {};

  try {
    propertiesToAdd = mapProperties(properties, boardSchema);
  }
  catch (error) {
    return res.status(400).json(error);
  }

  const pageId = v4();

  const block = await prisma.block.create({
    data: {
      id: v4(),
      user: {
        connect: {
          id: req.botUser.id
        }
      },
      updatedBy: req.botUser.id,
      type: 'card',
      rootId: id as string,
      parentId: id as string,
      title,
      space: {
        connect: {
          id: board.spaceId
        }
      },
      schema: 1,
      fields: {
        contentOrder: [
          pageId
        ],
        headerImage: null,
        icon: '',
        isTemplate: false,
        properties: propertiesToAdd
      }

    }
  });

  const page = await prisma.block.create({
    data: {
      id: pageId,
      user: {
        connect: {
          id: req.botUser.id
        }
      },
      updatedBy: req.botUser.id,
      type: 'charm_text',
      rootId: id as string,
      parentId: block.id,
      title: '',
      space: {
        connect: {
          id: board.spaceId
        }
      },
      schema: 1,
      fields: {
      }

    }
  });

  const card = new PageFromBlock(block, (board.fields as any).cardProperties);

  return res.status(201).json(card);

}

export default handler;
