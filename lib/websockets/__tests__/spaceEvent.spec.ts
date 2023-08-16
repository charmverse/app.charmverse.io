import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getPagePath } from 'lib/pages';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { DocumentRoom } from '../documentEvents/docRooms';
import { DocumentEventHandler } from '../documentEvents/documentEvents';
import type { ClientMessage } from '../interfaces';
import * as serverSocket from '../relay';
import { SpaceEventHandler } from '../spaceEvents';

jest.mock('../relay', () => {
  return {
    relay: {
      broadcast: jest.fn()
    }
  };
});

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
  const socketEmitMockFn = jest.fn();
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

  const spaceEventHandler = new SpaceEventHandler({} as any, docRooms);
  spaceEventHandler.userId = userId;

  return {
    socketEmitMockFn,
    spaceId,
    userId,
    childPageId,
    parentPage,
    spaceEventHandler
  };
}

describe.only('page_delete event handler', () => {
  it.only(`Archive nested pages and remove it from parent document's content when it have the nested page in its content and it is being viewed`, async () => {
    const { socketEmitMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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
    const relayBroadCastMock = jest.fn();
    serverSocket.relay.broadcast = relayBroadCastMock;

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
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [
          { id: childPageId, deletedAt: expect.any(Date), spaceId: parentPage.spaceId, deletedBy: expect.any(String) }
        ]
      },
      parentPage.spaceId
    );
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
      2,
      {
        type: 'pages_deleted',
        payload: [{ id: childPageId }]
      },
      parentPage.spaceId
    );
  });

  it(`Archive nested pages and remove it from parent document's content when it have the nested page in its content and it is not being viewed`, async () => {
    const { socketEmitMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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
    const relayBroadCastMock = jest.fn();
    serverSocket.relay.broadcast = relayBroadCastMock;

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
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [
          { id: childPageId, deletedAt: expect.any(Date), spaceId: parentPage.spaceId, deletedBy: expect.any(String) }
        ]
      },
      parentPage.spaceId
    );
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
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
  it(`Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed`, async () => {
    const { socketEmitMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
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

    const relayBroadCastMock = jest.fn();
    serverSocket.relay.broadcast = relayBroadCastMock;

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
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [{ id: childPageId, deletedAt: null, spaceId: parentPage.spaceId, deletedBy: null }]
      },
      parentPage.spaceId
    );
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
      2,
      {
        type: 'pages_restored',
        payload: [{ id: childPageId }]
      },
      parentPage.spaceId
    );
  });

  it(`Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed`, async () => {
    const { socketEmitMockFn, childPageId, spaceEventHandler, parentPage } = await socketSetup({
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const relayBroadCastMock = jest.fn();
    serverSocket.relay.broadcast = relayBroadCastMock;

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
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_meta_updated',
        payload: [{ id: childPageId, deletedAt: null, spaceId: parentPage.spaceId, deletedBy: null }]
      },
      parentPage.spaceId
    );
    expect(relayBroadCastMock).toHaveBeenNthCalledWith(
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
    const { spaceEventHandler, parentPage, socketEmitMockFn } = await socketSetup({
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });

    const childPageId = v4();
    const relayBroadCastMock = jest.fn();
    serverSocket.relay.broadcast = relayBroadCastMock;
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
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadCastMock).toHaveBeenCalled();
  });

  it(`Create nested page and add it to parent page content when parent document is being viewed`, async () => {
    const { socketEmitMockFn, spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: () => ({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
        ]
      })
    });
    const relayBroadCastMock = jest.fn();
    serverSocket.relay.broadcast = relayBroadCastMock;

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
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(relayBroadCastMock).toHaveBeenCalled();
  });
});
