/* eslint-disable camelcase */
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { NotionImporter } from '../NotionImporter/NotionImporter';

let user: LoggedInUser;

let space: Space;

beforeAll(async () => {
  const { user: u1, space: s1 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user = u1;
  space = s1;
});

function notionPage({
  title,
  object = 'page',
  parentId = null
}: {
  parentId?: string | null;
  object?: 'page' | 'database';
  title: string;
}) {
  return {
    object,
    id: v4(),
    cover: null,
    icon: {
      type: 'emoji',
      emoji: '🏣'
    },
    parent: !parentId
      ? {
          type: 'workspace',
          workspace: true
        }
      : {
          type: 'page_id',
          page_id: parentId
        },
    title: [
      {
        type: 'text',
        text: {
          content: 'Test ',
          link: null
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        },
        plain_text: title,
        href: null
      }
    ],
    properties: {
      title: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'Test ',
              link: null
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default'
            },
            plain_text: title,
            href: null
          }
        ]
      }
    }
  };
}

function paragraphNode({
  parentBlockId,
  textContent,
  hasChildren = false
}: {
  hasChildren?: boolean;
  parentBlockId: string;
  textContent: string;
}) {
  return {
    object: 'block',
    id: v4(),
    parent: {
      type: 'page_id',
      page_id: parentBlockId
    },
    has_children: hasChildren,
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: textContent,
            link: null
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default'
          },
          plain_text: textContent,
          href: null
        }
      ],
      color: 'default'
    }
  };
}

describe('Import notion workspace', () => {
  it(`should import regular notion pages and create charmverse pages`, async () => {
    // notion_page#_block#
    const n_p1 = notionPage({ title: 'Page 1' });
    const n_p2 = notionPage({ title: 'Page 2' });

    const n_p1_b1 = paragraphNode({
      parentBlockId: n_p1.id,
      textContent: 'n_p1_b1',
      hasChildren: true
    });

    const n_p1_b2 = paragraphNode({
      parentBlockId: n_p1.id,
      textContent: 'n_p1_b2'
    });

    const n_p2_b1 = paragraphNode({
      parentBlockId: n_p2.id,
      textContent: 'n_p2_b1'
    });

    const n_p1_b1_1 = paragraphNode({
      parentBlockId: n_p1_b1.id,
      textContent: 'n_p1_b1_1'
    });

    const notionImporter = new NotionImporter({
      spaceId: space.id,
      userId: user.id,
      client: {
        search: jest
          .fn()
          .mockResolvedValueOnce({
            has_more: true,
            next_cursor: 'next_cursor',
            results: [n_p1]
          })
          .mockResolvedValueOnce({
            has_more: false,
            results: [n_p2]
          }),
        blocks: {
          children: {
            list: jest.fn().mockImplementation(async (args) => {
              if (args.block_id === n_p1.id) {
                if (!args.start_cursor) {
                  return {
                    results: [n_p1_b1],
                    next_cursor: 'next_cursor'
                  };
                } else {
                  return {
                    results: [n_p1_b2]
                  };
                }
              } else if (args.block_id === n_p2.id) {
                return {
                  results: [n_p2_b1]
                };
              } else if (args.block_id === n_p1_b1.id) {
                return {
                  results: [n_p1_b1_1]
                };
              }
            })
          }
        }
      } as any
    });

    const workspaceName = 'Imported Workspace';
    await notionImporter.import({
      workspaceIcon: '🙂',
      workspaceName
    });

    const workspacePage = await prisma.page.findFirst({
      where: {
        spaceId: space.id,
        title: workspaceName
      }
    });

    const cv_p1 = await prisma.page.findFirst({
      where: {
        title: n_p1.properties.title.title[0].plain_text
      }
    });

    const cv_p2 = await prisma.page.findFirst({
      where: {
        title: n_p2.properties.title.title[0].plain_text
      }
    });

    expect(workspacePage).toBeTruthy();
    expect(cv_p1).toBeTruthy();
    expect(cv_p2).toBeTruthy();
  });

  it(`should import database notion pages and create charmverse pages`, async () => {
    // notion_page#_block#
    const n_dp1 = notionPage({ title: 'Database Page 1', object: 'database' });
    const n_dp1_1 = notionPage({ title: 'Database Page 1 Page 1' });
    const n_dp1_2 = notionPage({ title: 'Database Page 1 Page 2' });
    const n_dp1_1_b1 = paragraphNode({
      parentBlockId: n_dp1_1.id,
      textContent: 'n_dp1_1_b1'
    });
    const n_dp1_2_b1 = paragraphNode({
      parentBlockId: n_dp1_2.id,
      textContent: 'n_dp1_2_b1'
    });

    const notionImporter = new NotionImporter({
      spaceId: space.id,
      userId: user.id,
      client: {
        search: jest.fn().mockResolvedValueOnce({
          has_more: true,
          results: [n_dp1]
        }),
        databases: {
          query: jest.fn().mockImplementation(async (args) => {
            if (!args.start_cursor) {
              return {
                results: [n_dp1_1],
                next_cursor: 'next_cursor',
                has_more: true
              };
            } else {
              return {
                results: [n_dp1_2]
              };
            }
          })
        },
        blocks: {
          children: {
            list: jest.fn().mockImplementation(async (args) => {
              if (args.block_id === n_dp1_1.id) {
                return {
                  results: [n_dp1_1_b1]
                };
              } else if (args.block_id === n_dp1_2.id) {
                return {
                  results: [n_dp1_2_b1]
                };
              }
            })
          }
        }
      } as any
    });

    const workspaceName = 'Imported Workspace';
    await notionImporter.import({
      workspaceIcon: '🙂',
      workspaceName
    });
    const workspacePage = await prisma.page.findFirst({
      where: {
        spaceId: space.id,
        title: workspaceName
      }
    });
    const cv_dp1 = await prisma.page.findFirst({
      where: {
        title: n_dp1.properties.title.title[0].plain_text
      }
    });
    const cv_dp1_1 = await prisma.page.findFirst({
      where: {
        title: n_dp1_1.properties.title.title[0].plain_text
      }
    });
    const cv_dp1_2 = await prisma.page.findFirst({
      where: {
        title: n_dp1_2.properties.title.title[0].plain_text
      }
    });
    expect(workspacePage).toBeTruthy();
    expect(cv_dp1).toBeTruthy();
    expect(cv_dp1_1).toBeTruthy();
    expect(cv_dp1_2).toBeTruthy();
  });
});
