import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getPagePath } from 'lib/pages';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { DocumentRoom } from '../documentEvents/docRooms';
import { DocumentEventHandler } from '../documentEvents/documentEvents';
import type { ClientMessage } from '../interfaces';
import { SpaceEventHandler } from '../spaceEvents';

async function socketSetup({
  participants = false,
  content
}: {
  participants?: boolean;
  content: (childPageId: string) => PageContent;
}) {
  const { space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  const spaceId = space.id;
  const userId = user.id;
  const childPageId = v4();
  const parentContent = content(childPageId);
  const parentPage = await testUtilsPages.generatePage({ spaceId, createdBy: userId, content: parentContent });

  await testUtilsPages.generatePage({
    id: childPageId,
    spaceId,
    createdBy: userId,
    parentId: parentPage.id
  });

  const docRooms: Map<string | undefined, DocumentRoom> = new Map();

  if (participants) {
    docRooms.set(parentPage.id, {
      participants: new Map([]),
      doc: {
        id: parentPage.id,
        content: parentContent,
        version: 1,
        spaceId,
        hasContent: true,
        diffs: [],
        galleryImage: null,
        type: 'page'
      },
      node: getNodeFromJson(parentContent),
      lastSavedVersion: 0
    });

    const documentEvent = new DocumentEventHandler(
      {
        emit() {},
        data: {
          documentId: parentPage.id,
          user,
          permissions: {
            edit_content: true
          }
        }
      } as any,
      docRooms
    );

    const parentPageDocRoom = docRooms.get(parentPage.id) as DocumentRoom;
    parentPageDocRoom.participants.set(userId, documentEvent);
  }

  const spaceEventHandler = new SpaceEventHandler({} as any, docRooms);
  spaceEventHandler.userId = userId;

  return {
    spaceId,
    userId,
    childPageId,
    parentPage,
    spaceEventHandler
  };
}

describe('page_delete event handler', () => {
  it(`Archive nested pages and remove it from parent document's content when it have the nested page in its content and it is being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'page', attrs: { id: _childPageId } },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });
    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 1' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 2' }],
          attrs: {
            track: []
          }
        }
      ]
    });

    expect(childPage.deletedAt).toBeTruthy();
  });

  it(`Archive nested pages and remove it from parent document's content when it have the nested page in its content and it is not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'page', attrs: { id: _childPageId } },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 1' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 2' }],
          attrs: {
            track: []
          }
        }
      ]
    });

    expect(childPage.deletedAt).toBeTruthy();
  });

  const parentPageContent: PageContent = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
    ]
  };

  it(`Only archive nested pages when parent document doesn't have the nested page in its content and it is being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: () => parentPageContent
    });
    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual(parentPageContent);

    expect(childPage.deletedAt).toBeTruthy();
  });

  it(`Only archive nested pages when parent document doesn't have the nested page in its content and it is not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      content: () => parentPageContent
    });
    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual(parentPageContent);

    expect(childPage.deletedAt).toBeTruthy();
  });
});

describe('page_restored event handler', () => {
  it(`Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const message: ClientMessage = {
      type: 'page_restored',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 1' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 2' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'page',
          attrs: {
            track: [],
            id: childPageId,
            path: null,
            type: null
          }
        },
        {
          type: 'paragraph',
          attrs: {
            track: []
          }
        }
      ]
    });

    expect(childPage.deletedAt).toBeFalsy();
  });

  it(`Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const message: ClientMessage = {
      type: 'page_restored',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 1' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 2' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'page',
          attrs: {
            track: [],
            id: childPageId,
            path: null,
            type: null
          }
        },
        {
          type: 'paragraph',
          attrs: {
            track: []
          }
        }
      ]
    });

    expect(childPage.deletedAt).toBeFalsy();
  });

  it(`Only restore nested pages when parent document has the nested page in its content and it is being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          {
            type: 'page',
            attrs: {
              id: _childPageId
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const message: ClientMessage = {
      type: 'page_restored',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
        {
          type: 'page',
          attrs: {
            id: childPageId
          }
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
      ]
    });

    expect(childPage.deletedAt).toBeFalsy();
  });

  it(`Only restore nested page when parent document has the nested page in its content and its not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          {
            type: 'page',
            attrs: {
              id: _childPageId
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const message: ClientMessage = {
      type: 'page_restored',
      payload: {
        id: childPageId
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
        {
          type: 'page',
          attrs: {
            id: childPageId
          }
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
      ]
    });

    expect(childPage.deletedAt).toBeFalsy();
  });
});

describe('page_created event handler', () => {
  it(`Create nested page and add it to parent page content when parent document is not being viewed`, async () => {
    const { spaceEventHandler, parentPage } = await socketSetup({
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const childPageId = v4();

    const message: ClientMessage = {
      type: 'page_created',
      payload: {
        id: childPageId,
        type: 'page',
        parentId: parentPage.id,
        path: getPagePath(),
        content: undefined,
        contentText: '',
        spaceId: parentPage.spaceId,
        title: '',
        boardId: null
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 1' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 2' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'page',
          attrs: {
            track: [],
            id: childPageId,
            path: null,
            type: null
          }
        },
        {
          type: 'paragraph',
          attrs: {
            track: []
          }
        }
      ]
    });

    expect(childPage).toBeTruthy();
  });

  it(`Create nested page and add it to parent page content when parent document is being viewed`, async () => {
    const { spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const childPageId = v4();

    const message: ClientMessage = {
      type: 'page_created',
      payload: {
        id: childPageId,
        type: 'page',
        parentId: parentPage.id,
        path: getPagePath(),
        content: undefined,
        contentText: '',
        spaceId: parentPage.spaceId,
        title: '',
        boardId: null
      }
    };

    await spaceEventHandler.onMessage(message);

    const parentPageWithContent = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const childPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPageId
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toStrictEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 1' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Text content 2' }],
          attrs: {
            track: []
          }
        },
        {
          type: 'page',
          attrs: {
            track: [],
            id: childPageId,
            path: null,
            type: null
          }
        },
        {
          type: 'paragraph',
          attrs: {
            track: []
          }
        }
      ]
    });

    expect(childPage).toBeTruthy();
  });
});
