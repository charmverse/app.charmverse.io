/* eslint-disable @typescript-eslint/no-shadow */
import type { Page, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { v4 } from 'uuid';

import { getPagePath } from 'lib/pages';
import { builders as _ } from 'lib/prosemirror/builders';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';

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
  childCount = 1
}: {
  childCount?: number;
  spaceId: string;
  user: User;
  participants?: boolean;
  content: (...childPages: Page[]) => PageContent;
  docRooms: Map<string | undefined, DocumentRoom>;
}) {
  const userId = user.id;
  const childPages: Page[] = await Promise.all(
    new Array(childCount).fill(0).map(() =>
      testUtilsPages.generatePage({
        id: v4(),
        spaceId,
        createdBy: userId
      })
    )
  );

  const parentContent = content(...childPages);

  const parentPage = await testUtilsPages.generatePage({ spaceId, createdBy: userId, content: parentContent });
  await prisma.page.updateMany({
    where: {
      id: {
        in: childPages.map((page) => page.id)
      }
    },
    data: {
      parentId: parentPage.id
    }
  });
  const socketEmitMockFn = jest.fn();

  const relayBroadcastMockFn = jest.fn();

  const websocketBroadcaster = new WebsocketBroadcaster();

  websocketBroadcaster.broadcast = relayBroadcastMockFn;

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
    parentPage,
    childPages,
    websocketBroadcaster,
    relayBroadcastMockFn
  };
}

async function socketSetup({
  participants = false,
  content,
  childCount = 1
}: {
  childCount?: number;
  participants?: boolean;
  content: (...childPages: Page[]) => PageContent;
}) {
  const { space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

  const spaceId = space.id;
  const userId = user.id;

  const { docRooms, childPages, parentPage, socketEmitMockFn, websocketBroadcaster, relayBroadcastMockFn } =
    await createPageAndSetupDocRooms({
      participants,
      content,
      docRooms: new Map(),
      spaceId,
      user,
      childCount
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
  spaceEventHandler.spaceId = spaceId;

  return {
    docRooms,
    socketEmitMockFn,
    spaceId,
    userId,
    space,
    user,
    parentPage,
    spaceEventHandler,
    childPages,
    relayBroadcastMockFn
  };
}

function contentWithChildPageNode(...childPages: (Page & { isLinkedPage?: boolean })[]) {
  return _.doc(
    ...childPages
      .map((childPage, index) => [
        _.p(`${index + 1}`),
        childPage.isLinkedPage
          ? _.linkedPage({
              id: childPage.id,
              path: childPage.path,
              type: childPage.type
            })
          : _.page({
              id: childPage.id,
              path: childPage.path,
              type: childPage.type
            })
      ])
      .flat(),
    _.p(`${childPages.length + 1}`)
  ).toJSON();
}

const regularContent = _.doc(_.p('1'), _.p('2')).toJSON();

describe('page delete event handler', () => {
  it(`Archive nested pages and remove it from parent document content when it have the nested page in its content and it is being viewed`, async () => {
    const { relayBroadcastMockFn, socketEmitMockFn, childPages, spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode
    });

    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPages[0].id
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

    const childPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toMatchObject(regularContent);
    expect(childPageDb.deletedAt).toBeTruthy();
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_deleted',
        payload: [
          {
            id: childPages[0].id
          }
        ]
      },
      parentPage.spaceId
    );
  });

  it(`Archive nested pages and remove it from parent documents content when it have the nested page in its content and it is not being viewed`, async () => {
    const { socketEmitMockFn, relayBroadcastMockFn, childPages, spaceEventHandler, parentPage } = await socketSetup({
      content: contentWithChildPageNode
    });

    const message: ClientMessage = {
      type: 'page_deleted',
      payload: {
        id: childPages[0].id
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

    const childPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toMatchObject(regularContent);
    expect(childPageDb.deletedAt).toBeTruthy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();

    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_deleted',
        payload: [{ id: childPages[0].id }]
      },
      parentPage.spaceId
    );
  });
});

describe('page_duplicated event handler', () => {
  it(`Should add the nested page in the parent document content when it is not being viewed`, async () => {
    const { childPages, spaceEventHandler, parentPage } = await socketSetup({
      content: contentWithChildPageNode
    });

    const newChildPage = await testUtilsPages.generatePage({
      createdBy: parentPage.createdBy,
      spaceId: parentPage.spaceId,
      parentId: parentPage.id
    });

    const message: ClientMessage = {
      type: 'page_duplicated',
      payload: {
        pageId: newChildPage.id
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

    expect(parentPageWithContent.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        }),
        _.p('2'),
        _.page({
          id: newChildPage.id
        })
      ).toJSON()
    );
  });

  it(`Should add the nested page in the parent document content when it is being viewed`, async () => {
    const { childPages, spaceEventHandler, parentPage, socketEmitMockFn } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode
    });

    const newChildPage = await testUtilsPages.generatePage({
      createdBy: parentPage.createdBy,
      spaceId: parentPage.spaceId,
      parentId: parentPage.id
    });

    const message: ClientMessage = {
      type: 'page_duplicated',
      payload: {
        pageId: newChildPage.id
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

    expect(parentPageWithContent.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        }),
        _.p('2'),
        _.page({
          id: newChildPage.id
        })
      ).toJSON()
    );

    expect(socketEmitMockFn).toHaveBeenCalled();
  });
});

describe('page_restored event handler', () => {
  it('Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is not being viewed', async () => {
    const { socketEmitMockFn, relayBroadcastMockFn, childPages, spaceEventHandler, parentPage } = await socketSetup({
      content: () => regularContent
    });
    const message: ClientMessage = {
      type: 'page_restored',
      payload: {
        id: childPages[0].id
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
    const childPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        deletedAt: true
      }
    });
    expect(parentPageWithContent.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPages[0].id
        })
      ).toJSON()
    );
    expect(childPageDb.deletedAt).toBeFalsy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_restored',
        payload: [{ id: childPages[0].id }]
      },
      parentPage.spaceId
    );
  });

  it(`Restore nested pages and add it to parent page content when parent document has the nested page in its content and it is being viewed`, async () => {
    const { relayBroadcastMockFn, socketEmitMockFn, childPages, spaceEventHandler, parentPage } = await socketSetup({
      content: () => regularContent
    });

    const message: ClientMessage = {
      type: 'page_restored',
      payload: {
        id: childPages[0].id
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

    const childPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        deletedAt: true
      }
    });

    expect(parentPageWithContent.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPages[0].id
        })
      ).toJSON()
    );

    expect(childPageDb.deletedAt).toBeFalsy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenNthCalledWith(
      1,
      {
        type: 'pages_restored',
        payload: [{ id: childPages[0].id }]
      },
      parentPage.spaceId
    );
  });
});

describe('page_created event handler', () => {
  it(`Create nested page and add it to parent page content when parent document is not being viewed`, async () => {
    const { relayBroadcastMockFn, spaceEventHandler, parentPage, socketEmitMockFn } = await socketSetup({
      content: () => regularContent
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

    expect(parentPageWithContent.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPageId
        })
      ).toJSON()
    );

    expect(childPage).toBeTruthy();
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenCalled();
  });

  it(`Create nested page and add it to parent page content when parent document is being viewed`, async () => {
    const { relayBroadcastMockFn, socketEmitMockFn, spaceEventHandler, parentPage } = await socketSetup({
      participants: true,
      content: () => regularContent
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

    expect(parentPageWithContent.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPageId
        })
      ).toJSON()
    );

    expect(childPage).toBeTruthy();
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(relayBroadcastMockFn).toHaveBeenCalled();
  });
});

describe('page_reordered_sidebar_to_sidebar event handler', () => {
  it(`Move page from one parent page to another parent page when both documents are being viewed`, async () => {
    const { spaceEventHandler, socketEmitMockFn, parentPage, childPages, docRooms, space, user } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode
    });

    const { parentPage: parentPage2, socketEmitMockFn: socketEmitMockFn2 } = await createPageAndSetupDocRooms({
      docRooms,
      spaceId: space.id,
      user,
      participants: true,
      content: () => regularContent
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newParentId: parentPage2.id,
        pageId: childPages[0].id
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

    expect(previousParentPage.content).toMatchObject(regularContent);

    expect(newParentPage.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
    expect(socketEmitMockFn).toHaveBeenCalled();
    expect(socketEmitMockFn2).toHaveBeenCalled();
  });

  it(`Move page from one parent page to another parent page (with children) when none of the documents are being viewed`, async () => {
    const { spaceEventHandler, childPages, parentPage, docRooms, space, user, socketEmitMockFn } = await socketSetup({
      content: contentWithChildPageNode
    });

    const {
      parentPage: parentPage2,
      childPages: childPages2,
      socketEmitMockFn: socketEmitMockFn2
    } = await createPageAndSetupDocRooms({
      docRooms,
      spaceId: space.id,
      user,
      content: contentWithChildPageNode
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newParentId: parentPage2.id,
        pageId: childPages[0].id
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

    expect(previousParentPage.content).toMatchObject(regularContent);

    expect(newParentPage.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.page({
          id: childPages2[0].id,
          path: childPages2[0].path,
          type: childPages2[0].type
        }),
        _.p('2'),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
    expect(socketEmitMockFn).not.toHaveBeenCalled();
    expect(socketEmitMockFn2).not.toHaveBeenCalled();
  });

  it(`Move page from parent page to root level and the parent document is being viewed`, async () => {
    const { spaceEventHandler, parentPage, childPages, socketEmitMockFn } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
        newParentId: null,
        pageId: childPages[0].id
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

    expect(previousParentPage.content).toMatchObject(regularContent);

    expect(socketEmitMockFn).toHaveBeenCalled();
  });

  it(`Move page from root level to another parent when the parent document is not being viewed`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const userId = user.id;
    const spaceId = space.id;

    const parentPage = await testUtilsPages.generatePage({
      spaceId: space.id,
      createdBy: userId,
      content: regularContent
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
    spaceEventHandler.spaceId = spaceId;

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_sidebar',
      payload: {
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

    expect(newParentPage.content).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPage.id,
          type: childPage.type,
          path: childPage.path
        })
      ).toJSON()
    );
  });
});

describe('page_reordered_sidebar_to_editor event handler', () => {
  it(`Move nested page from the sidebar to the editor (on top of another nested page)`, async () => {
    const { spaceEventHandler, docRooms, space, user, parentPage, childPages } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode
    });

    const { childPages: childPages2 } = await createPageAndSetupDocRooms({
      docRooms,
      spaceId: space.id,
      user,
      content: contentWithChildPageNode
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_editor',
      payload: {
        pageId: childPages[0].id,
        newParentId: childPages2[0].id,
        dropPos: null
      }
    });

    const parentPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const parentPageContent = parentPageDb.content as PageContent;
    const childPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        parentId: true
      }
    });

    const childPage2Db = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages2[0].id
      },
      select: {
        content: true
      }
    });
    const childPage2Content = childPage2Db.content as PageContent;

    expect(childPageDb.parentId).toBe(childPages2[0].id);
    expect(parentPageContent).toMatchObject(regularContent);
    expect(childPage2Content).toMatchObject(
      _.doc(
        _.p(),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
  });

  it(`Move nested page from the sidebar to the editor (below a nested page)`, async () => {
    const { spaceEventHandler, docRooms, space, user, parentPage, childPages } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode
    });

    const { parentPage: parentPage2, childPages: childPages2 } = await createPageAndSetupDocRooms({
      docRooms,
      spaceId: space.id,
      user,
      content: contentWithChildPageNode
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_sidebar_to_editor',
      payload: {
        pageId: childPages[0].id,
        newParentId: parentPage2!.id,
        dropPos: 3
      }
    });

    const parentPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const parentPage2Db = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage2!.id
      },
      select: {
        content: true
      }
    });

    const parentPageContent = parentPageDb.content as PageContent;
    const parentPage2Content = parentPage2Db.content as PageContent;
    const childPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        parentId: true
      }
    });

    expect(childPageDb.parentId).toBe(parentPage2.id);
    expect(parentPageContent).toMatchObject(regularContent);
    expect(parentPage2Content).toMatchObject(
      _.doc(
        _.p('1'),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        }),
        _.page({
          id: childPages2[0].id,
          path: childPages2[0].path,
          type: childPages2[0].type
        }),
        _.p('2')
      ).toJSON()
    );
  });
});

describe('page_reordered_editor_to_editor event handler', () => {
  it(`Move a nested page node from the editor to another nested page node in the editor`, async () => {
    const { spaceEventHandler, parentPage, childPages } = await socketSetup({
      participants: true,
      content: contentWithChildPageNode,
      childCount: 2
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_editor_to_editor',
      payload: {
        pageId: childPages[0].id,
        newParentId: childPages[1].id,
        currentParentId: parentPage.id,
        draggedNode: {
          type: 'page',
          attrs: {
            id: childPages[0].id
          }
        },
        dragNodePos: 3
      }
    });

    const parentPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const parentPageContent = parentPageDb.content as PageContent;
    const childPage1 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        parentId: true
      }
    });

    const childPage2 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[1].id
      },
      select: {
        content: true
      }
    });

    const childPage2Content = childPage2.content as PageContent;

    expect(childPage1.parentId).toBe(childPages[1].id);
    expect(parentPageContent).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPages[1].id,
          path: childPages[1].path,
          type: childPages[1].type
        }),
        _.p('3')
      ).toJSON()
    );

    expect(childPage2Content).toMatchObject(
      _.doc(
        _.p(),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
  });

  it(`Move a linked page node from the editor to a nested page node in the editor`, async () => {
    const { spaceEventHandler, parentPage, childPages } = await socketSetup({
      participants: true,
      content: (childPage1, childPage2) =>
        contentWithChildPageNode(
          {
            ...childPage1,
            isLinkedPage: true
          },
          childPage2
        ),
      childCount: 2
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_editor_to_editor',
      payload: {
        pageId: childPages[0].id,
        newParentId: childPages[1].id,
        currentParentId: parentPage.id,
        draggedNode: {
          type: 'linkedPage',
          attrs: {
            id: childPages[0].id
          }
        },
        dragNodePos: 3
      }
    });

    const parentPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const parentPageContent = parentPageDb.content as PageContent;
    const childPage1 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        parentId: true
      }
    });

    const childPage2 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[1].id
      },
      select: {
        content: true
      }
    });

    const childPage2Content = childPage2.content as PageContent;

    expect(childPage1.parentId).toBe(parentPage.id);
    expect(parentPageContent).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.page({
          id: childPages[1].id,
          path: childPages[1].path,
          type: childPages[1].type
        }),
        _.p('3')
      ).toJSON()
    );

    expect(childPage2Content).toMatchObject(
      _.doc(
        _.p(),
        _.linkedPage({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
  });

  it(`Move a nested page node from the editor to another linked page node in the editor`, async () => {
    const { spaceEventHandler, parentPage, childPages } = await socketSetup({
      participants: true,
      content: (childPage1, childPage2) =>
        contentWithChildPageNode(childPage1, {
          ...childPage2,
          isLinkedPage: true
        }),
      childCount: 2
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_editor_to_editor',
      payload: {
        pageId: childPages[0].id,
        newParentId: childPages[1].id,
        currentParentId: parentPage.id,
        draggedNode: {
          type: 'page',
          attrs: {
            id: childPages[0].id
          }
        },
        dragNodePos: 3
      }
    });

    const parentPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const parentPageContent = parentPageDb.content as PageContent;
    const childPage1 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        parentId: true
      }
    });

    const childPage2 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[1].id
      },
      select: {
        content: true
      }
    });

    const childPage2Content = childPage2.content as PageContent;

    expect(childPage1.parentId).toBe(childPages[1].id);
    expect(parentPageContent).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.linkedPage({
          id: childPages[1].id,
          path: childPages[1].path,
          type: childPages[1].type
        }),
        _.p('3')
      ).toJSON()
    );

    expect(childPage2Content).toMatchObject(
      _.doc(
        _.p(),
        _.page({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
  });

  it(`Move a linked page node from the editor to another linked page node in the editor`, async () => {
    const { spaceEventHandler, parentPage, childPages } = await socketSetup({
      participants: true,
      content: (childPage1, childPage2) =>
        contentWithChildPageNode(
          {
            ...childPage1,
            isLinkedPage: true
          },
          {
            ...childPage2,
            isLinkedPage: true
          }
        ),
      childCount: 2
    });

    await spaceEventHandler.onMessage({
      type: 'page_reordered_editor_to_editor',
      payload: {
        pageId: childPages[0].id,
        newParentId: childPages[1].id,
        currentParentId: parentPage.id,
        draggedNode: {
          type: 'linkedPage',
          attrs: {
            id: childPages[0].id
          }
        },
        dragNodePos: 3
      }
    });

    const parentPageDb = await prisma.page.findUniqueOrThrow({
      where: {
        id: parentPage.id
      },
      select: {
        content: true
      }
    });

    const parentPageContent = parentPageDb.content as PageContent;
    const childPage1 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[0].id
      },
      select: {
        parentId: true
      }
    });

    const childPage2 = await prisma.page.findUniqueOrThrow({
      where: {
        id: childPages[1].id
      },
      select: {
        content: true
      }
    });

    const childPage2Content = childPage2.content as PageContent;

    expect(childPage1.parentId).toBe(parentPage.id);
    expect(parentPageContent).toMatchObject(
      _.doc(
        _.p('1'),
        _.p('2'),
        _.linkedPage({
          id: childPages[1].id,
          path: childPages[1].path,
          type: childPages[1].type
        }),
        _.p('3')
      ).toJSON()
    );

    expect(childPage2Content).toMatchObject(
      _.doc(
        _.p(),
        _.linkedPage({
          id: childPages[0].id,
          path: childPages[0].path,
          type: childPages[0].type
        })
      ).toJSON()
    );
  });
});
