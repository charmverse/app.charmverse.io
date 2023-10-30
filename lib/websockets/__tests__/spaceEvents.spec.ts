import type { Page, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getPagePath } from 'lib/pages';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { WebsocketBroadcaster } from '../broadcaster';
import type { DocumentRoom } from '../documentEvents/docRooms';
import { DocumentEventHandler } from '../documentEvents/documentEvents';
import type { ClientMessage } from '../interfaces';
import { SpaceEventHandler } from '../spaceEvents';

async function createPageAndSetupDocRooms({
  participants = false,
  content,
  docRooms,
  spaceId,
  user,
  createChildPage = true
}: {
  createChildPage?: boolean;
  spaceId: string;
  user: User;
  participants?: boolean;
  content: (childPageId: string) => PageContent;
  docRooms: Map<string | undefined, DocumentRoom>;
}) {
  const userId = user.id;
  const childPageId = v4();
  const parentContent = content(childPageId);
  const parentPage = await testUtilsPages.generatePage({ spaceId, createdBy: userId, content: parentContent });
  const socketEmitMockFn = jest.fn();
  let childPage: Page | null = null;

  const relayBroadcastMockFn = jest.fn();

  const websocketBroadcaster = new WebsocketBroadcaster();

  websocketBroadcaster.broadcast = relayBroadcastMockFn;

  if (createChildPage) {
    childPage = await testUtilsPages.generatePage({
      id: childPageId,
      spaceId,
      createdBy: userId,
      parentId: parentPage.id
    });
  }

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
      websocketBroadcaster,
      {
        emit: socketEmitMockFn,
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

  return {
    docRooms,
    socketEmitMockFn,
    childPageId,
    parentPage,
    childPage,
    websocketBroadcaster,
    relayBroadcastMockFn
  };
}

async function socketSetup({
  participants = false,
  createChildPage = true,
  content
}: {
  createChildPage?: boolean;
  participants?: boolean;
  content: (childPageId: string) => PageContent;
}) {
  const { space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

  const spaceId = space.id;
  const userId = user.id;

  const { docRooms, childPage, childPageId, parentPage, socketEmitMockFn, websocketBroadcaster, relayBroadcastMockFn } =
    await createPageAndSetupDocRooms({
      createChildPage,
      participants,
      content,
      docRooms: new Map(),
      spaceId,
      user
    });

  const spaceEventHandler = new SpaceEventHandler(
    websocketBroadcaster,
    {
      on: jest.fn(),
      emit: jest.fn()
    } as any,
    docRooms
  );
  spaceEventHandler.userId = userId;

  return {
    docRooms,
    socketEmitMockFn,
    spaceId,
    userId,
    space,
    user,
    childPageId,
    parentPage,
    spaceEventHandler,
    childPage,
    relayBroadcastMockFn
  };
}

describe('page delete event handler', () => {
  it(`Archive nested pages and remove it from parent document content when it have the nested page in its content and it is being viewed`, async () => {
    const { relayBroadcastMockFn, socketEmitMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [
          { id: childPageId, deletedAt: expect.any(Date), spaceId: parentPage.spaceId, deletedBy: expect.any(String) }
        ]
      },
      parentPage.spaceId
    );
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      2,
      {
        type: 'pages_deleted',
        payload: [{ id: childPageId }]
      },
      parentPage.spaceId
    );
  });

  it(`Archive nested pages and remove it from parent documents content when it have the nested page in its content and it is not being viewed`, async () => {
    const { socketEmitMockFn, relayBroadcastMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [
          { id: childPageId, deletedAt: expect.any(Date), spaceId: parentPage.spaceId, deletedBy: expect.any(String) }
        ]
      },
      parentPage.spaceId
    );
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      2,
      {
        type: 'pages_deleted',
        payload: [{ id: childPageId }]
      },
      parentPage.spaceId
    );
  });
});

describe('page_restored event handler', () => {
  it('Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed', async () => {
    const { socketEmitMockFn, relayBroadcastMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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
        }
      ]
    });
    expect(childPage.deletedAt).toBeFalsy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [{ id: childPageId, deletedAt: null, spaceId: parentPage.spaceId, deletedBy: null }]
      },
      parentPage.spaceId
    );
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      2,
      {
        type: 'pages_restored',
        payload: [{ id: childPageId }]
      },
      parentPage.spaceId
    );
  });

  it(`Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed`, async () => {
    const { relayBroadcastMockFn, socketEmitMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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
        }
      ]
    });

    expect(childPage.deletedAt).toBeFalsy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [{ id: childPageId, deletedAt: null, spaceId: parentPage.spaceId, deletedBy: null }]
      },
      parentPage.spaceId
    );
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      2,
      {
        type: 'pages_restored',
        payload: [{ id: childPageId }]
      },
      parentPage.spaceId
    );
  });
});

describe('page_created event handler', () => {
  it(`Create nested page and add it to parent page content when parent document is not being viewed`, async () => {
    const { relayBroadcastMockFn, spaceEventHandler, parentPage, socketEmitMockFn } = await socketSetup({
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
        }
      ]
    });

    expect(childPage).toBeTruthy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenCalled();
  });

  it(`Create nested page and add it to parent page content when parent document is being viewed`, async () => {
    const { relayBroadcastMockFn, socketEmitMockFn, spaceEventHandler, parentPage } = await socketSetup({
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
        }
      ]
    });

    expect(childPage).toBeTruthy();
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenCalled();
  });
});

describe('page_reordered_sidebar_to_sidebar event handler', () => {
  it(`Move page from one parent page to another parent page when both documents are being viewed`, async () => {
    const { spaceEventHandler, socketEmitMockFn, parentPage, childPage, docRooms, space, user } = await socketSetup({
      participants: true,
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          {
            type: 'page',
            attrs: {
              track: [],
              id: _childPageId
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const { parentPage: parentPage2, socketEmitMockFn: socketEmitMockFn2 } = await createPageAndSetupDocRooms({
      docRooms,
      spaceId: space.id,
      user,
      participants: true,
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newIndex: 1,
        newParentId: parentPage2.id,
        pageId: childPage!.id
      }
    });

    const previousParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const newParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage2.id
      },
      select: {
        content: true
      }
    });

    expect(previousParentPage.content).toStrictEqual({
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

    expect(newParentPage.content).toStrictEqual({
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
            id: childPage!.id,
            path: childPage!.path,
            type: childPage!.type
          }
        }
      ]
    });
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(socketEmitMockFn2).toHaveBeenCalled();
  });

  it(`Move page from one parent page to another parent page (with children) when none of the documents are being viewed`, async () => {
    const { spaceEventHandler, childPage, parentPage, docRooms, space, user, socketEmitMockFn } = await socketSetup({
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          {
            type: 'page',
            attrs: {
              track: [],
              id: _childPageId
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const {
      parentPage: parentPage2,
      childPage: childPage2,
      socketEmitMockFn: socketEmitMockFn2
    } = await createPageAndSetupDocRooms({
      docRooms,
      spaceId: space.id,
      user,
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          {
            type: 'page',
            attrs: {
              track: [],
              id: _childPageId
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newIndex: 1,
        newParentId: parentPage2.id,
        pageId: childPage!.id
      }
    });

    const previousParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const newParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage2.id
      },
      select: {
        content: true
      }
    });

    expect(previousParentPage.content).toStrictEqual({
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

    expect(newParentPage.content).toStrictEqual({
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
          type: 'page',
          attrs: {
            type: null,
            path: null,
            track: [],
            id: childPage2!.id
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
            id: childPage!.id,
            path: childPage!.path,
            type: childPage!.type
          }
        }
      ]
    });
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(socketEmitMockFn2).not.toHaveBeenCalled();
  });

  it(`Move page from parent page to root level and the parent document is being viewed`, async () => {
    const { spaceEventHandler, parentPage, childPageId, socketEmitMockFn } = await socketSetup({
      participants: true,
      content: (_childPageId) => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          {
            type: 'page',
            attrs: {
              track: [],
              id: _childPageId
            }
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newIndex: 1,
        newParentId: null,
        pageId: childPageId
      }
    });

    const previousParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    expect(previousParentPage.content).toStrictEqual({
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

    expect(socketEmitMockFn).toHaveBeenCalled();
  });

  it(`Move page from root level to another parent when the parent document is not being viewed`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const userId = user.id;
    const spaceId = space.id;

    const parentContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
      ]
    };
    const parentPage = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: userId,
      content: parentContent
    });
    const childPage = await testUtilsPages.generatePage({
      spaceId,
      createdBy: userId
    });
    const childPageId = childPage.id;

    const spaceEventHandler = new SpaceEventHandler(
      new WebsocketBroadcaster(),
      {
        on: jest.fn(),
        emit: jest.fn()
      } as any,
      new Map()
    );
    spaceEventHandler.userId = userId;

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newIndex: 1,
        newParentId: parentPage.id,
        pageId: childPageId
      }
    });

    const newParentPage = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    expect(newParentPage.content).toStrictEqual({
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
            path: childPage.path,
            type: childPage.type
          }
        }
      ]
    });
  });
});
