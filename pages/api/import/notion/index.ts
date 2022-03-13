import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(importFromNotion);

async function importFromNotion (req: NextApiRequest, res: NextApiResponse<Page>) {
  const blockId = process.env.NOTION_PAGE_ID!;
  const { id } = req.session.user;
  const { spaceId } = req.body as {spaceId: string};
  const response = await notion.pages.retrieve({
    page_id: blockId
  }) as any;

  const pageToCreate: Prisma.PageCreateInput = {
    content: {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: []
      }]
    } as any,
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id
      }
    },
    updatedAt: new Date(),
    updatedBy: id,
    path: `page-${id}`,
    space: {
      connect: {
        id: spaceId
      }
    },
    icon: response.icon.emoji,
    title: response.properties.title.title[0].plain_text,
    type: 'page'
  };

  const createdPage = await prisma.page.create({ data: pageToCreate });

  return res.status(200).json(createdPage);
}

export default withSessionRoute(handler);
