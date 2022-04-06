
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, requireKeys } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { CardFromBlock } from 'pages/api/v1/databases/card.class';
import { v4 } from 'uuid';
import { Card, CardProperty } from '../../interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(requireKeys<Card>(['title', 'cardProperties'], 'body'))
  .post(createCard);

async function createCard (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Database not found' });
  }

  const { title, cardProperties } = req.body;

  const boardSchema = (board.fields as any).cardProperties as CardProperty [];

  const propertiesToAdd: Record<string, string | number> = {};

  const requestBodyProps = Object.keys(cardProperties);

  for (const property of requestBodyProps) {
    const matchedSchema = boardSchema.find(schema => schema.name === property);

    if (!matchedSchema) {
      return res.status(400).send({ error: `Field ${property} does not exist in this database` });
    }
    let valueToAssign = cardProperties[property];

    if (matchedSchema.type === 'select' || matchedSchema.type === 'multiSelect') {
      const matchingOption = matchedSchema.options.find(option => option.value === valueToAssign);

      if (!matchingOption) {
        return res.status(400).send({ error: `Value '${valueToAssign}' is not a valid option for ${matchedSchema.type} field '${property}'`, options: matchedSchema.options.map(option => option.value) });
      }
      valueToAssign = matchingOption.id;
    }

    propertiesToAdd[matchedSchema.id] = valueToAssign;

  }

  const placeholderUserId = v4();

  const pageId = v4();

  const block = await prisma.block.create({
    data: {
      id: v4(),
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

  const card = new CardFromBlock(block, (board.fields as any).cardProperties);

  return res.status(201).send(card);

}

export default handler;
