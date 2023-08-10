import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsPages } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { DocumentRoom } from '../documentEvents/docRooms';
import { DocumentEventHandler } from '../documentEvents/documentEvents';
import type { ClientMessage } from '../interfaces';
import { SpaceEventHandler } from '../spaceEvents';

describe('page_delete event handler', () => {
  it(`Delete linked pages from page content when parent document is being viewed`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const spaceId = space.id;
    const userId = user.id;
    const childPageId = v4();
    const parentPageDoc: PageContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 1' }] },
        { type: 'page', attrs: { id: childPageId } },
        { type: 'paragraph', content: [{ type: 'text', text: 'Text content 2' }] }
      ]
    };
    const parentPage = await testUtilsPages.generatePage({ spaceId, createdBy: userId, content: parentPageDoc });
    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPageId
      }
    };

    await testUtilsPages.generatePage({
      id: childPageId,
      spaceId,
      createdBy: userId,
      parentId: parentPage.id
    });

    const docRooms: Map<string | undefined, DocumentRoom> = new Map();

    docRooms.set(parentPage.id, {
      participants: new Map([]),
      doc: {
        id: parentPage.id,
        content: parentPageDoc,
        version: 1,
        spaceId,
        hasContent: true,
        diffs: [],
        galleryImage: null,
        type: 'page'
      },
      node: getNodeFromJson(parentPageDoc),
      lastSavedVersion: 0
    });

    const documentEvent = new DocumentEventHandler(
      {
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

    const spaceEventHandler = new SpaceEventHandler({} as any, docRooms);
    spaceEventHandler.userId = userId;

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
