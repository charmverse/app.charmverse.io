import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { DocumentRoom } from '../documentEvents/docRooms';
import { DocumentEventHandler } from '../documentEvents/documentEvents';
import type { ClientMessage } from '../interfaces';
import { SpaceEventHandler } from '../spaceEvents';

async function socketSetup({
  addParticipants = false,
  content
}: {
  addParticipants?: boolean;
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

  if (addParticipants) {
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
    childPageId,
    parentPage,
    spaceEventHandler
  };
}

describe('page_delete event handler', () => {
  it(`Delete linked pages from page content when parent document is being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      addParticipants: true,
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
  });

  it(`Delete linked pages from page content when parent document is not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      addParticipants: false,
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
  });
});

describe('page_restored event handler', () => {
  it(`Add linked pages to page content when parent document is being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      addParticipants: false,
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
  });

  it(`Add linked pages to page content when parent document is not being viewed`, async () => {
    const { childPageId, spaceEventHandler, parentPage } = await socketSetup({
      addParticipants: false,
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
  });
});
