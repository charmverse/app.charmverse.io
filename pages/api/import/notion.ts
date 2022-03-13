import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Client } from '@notionhq/client';
import { PageContent } from 'models';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(importFromNotion);

async function importFromNotion (req: NextApiRequest, res: NextApiResponse<Page>) {
  const blockId = process.env.NOTION_PAGE_ID!;
  const userId = req.session.user.id;
  const { spaceId } = req.body as {spaceId: string};
  const pageResponse = await notion.pages.retrieve({
    page_id: blockId
  }) as any;
  const blockChildrenResponse = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100
  }) as any;

  const pageContent: PageContent = {
    type: 'doc',
    content: []
  };

  blockChildrenResponse.results.forEach((result: any) => {
    if (result.type.startsWith('heading')) {
      const [, level] = result.type.split('_');
      pageContent.content?.push({
        type: 'heading',
        attrs: {
          level: parseInt(level, 10)
        },
        content: [
          {
            type: 'text',
            text: result[result.type].rich_text[0].plain_text
          }
        ]
      });
    }
  });

  if (pageContent.content?.length === 0) {
    pageContent.content?.push({
      type: 'paragraph',
      content: []
    });
  }

  const id = Math.random().toString().replace('0.', '');

  const pageToCreate: Prisma.PageCreateInput = {
    content: pageContent,
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id: userId
      }
    },
    updatedAt: new Date(),
    updatedBy: userId,
    path: `page-${id}`,
    space: {
      connect: {
        id: spaceId
      }
    },
    headerImage: pageResponse.cover.type === 'external' ? pageResponse.cover.external.url : null,
    icon: pageResponse.icon.emoji,
    title: pageResponse.properties.title.title[0].plain_text,
    type: 'page'
  };

  const createdPage = await prisma.page.create({ data: pageToCreate });

  return res.status(200).json(createdPage);
}

export default withSessionRoute(handler);
