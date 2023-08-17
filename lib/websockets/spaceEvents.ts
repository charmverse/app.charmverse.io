import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { archivePages } from 'lib/pages/archivePages';
import { createPage } from 'lib/pages/server/createPage';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { authSecret } from 'lib/session/config';
import type { ClientMessage, SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

import type { DocumentRoom } from './documentEvents/docRooms';
import type { DocumentEventHandler } from './documentEvents/documentEvents';
import type { ProsemirrorJSONStep } from './documentEvents/interfaces';

export class SpaceEventHandler {
  socketEvent = 'message';

  userId: string | null = null;

  docRooms: Map<string | undefined, DocumentRoom> = new Map();

  constructor(private socket: Socket, docRooms: Map<string | undefined, DocumentRoom>) {
    this.socket = socket;
    this.docRooms = docRooms;
  }

  init() {
    this.socket.on(this.socketEvent, async (message, callback) => {
      try {
        await this.onMessage(message, callback);
      } catch (error) {
        log.error('Error handling space socket message', error);
      }
    });

    this.socket.emit(this.socketEvent, { type: 'welcome' });
  }

  async onMessage(message: ClientMessage, callback?: (data: any) => void) {
    if (message.type === 'subscribe') {
      try {
        const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.payload.authToken, {
          password: authSecret
        });
        if (typeof decryptedUserId === 'string') {
          this.userId = decryptedUserId;
          relay.registerWorkspaceSubscriber({
            userId: decryptedUserId,
            socket: this.socket,
            roomId: message.payload.spaceId
          });
        }
      } catch (error) {
        log.error('Error subscribing user to space events', { error });
        this.sendError('Error subscribing to space');
      }
    } else if (message.type === 'page_deleted' && this.userId) {
      try {
        const pageId = message.payload.id;
        const { documentRoom, participant, parentId, spaceId, content, position } = await getPageDetails({
          id: pageId,
          userId: this.userId,
          docRooms: this.docRooms
        });

        if (parentId && documentRoom && participant && position !== null) {
          await participant.handleDiff(
            {
              type: 'diff',
              ds: [
                {
                  stepType: 'replace',
                  from: position,
                  to: position + 1
                }
              ],
              doc: documentRoom.doc.content,
              c: participant.messages.client,
              s: participant.messages.server,
              v: documentRoom.doc.version,
              rid: 0,
              cid: -1
            },
            { socketEvent: 'page_deleted' }
          );
        } else {
          if (parentId && position) {
            await applyDiffAndSaveDocument({
              content,
              parentId,
              userId: this.userId,
              diffs: [
                {
                  from: position,
                  to: position + 1,
                  stepType: 'replace'
                }
              ]
            });
          }
          // If the user is not in the document or the position of the page node is not found (present in sidebar)

          await archivePages({
            pageIds: [pageId],
            userId: this.userId,
            spaceId,
            archive: true
          });
        }
      } catch (error) {
        const errorMessage = 'Error deleting a page after link was deleted from its parent page';
        log.error(errorMessage, {
          error,
          pageId: message.payload.id,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_restored' && this.userId) {
      const pageId = message.payload.id;

      try {
        const { pageNode, documentRoom, participant, position, parentId, content, spaceId } = await getPageDetails({
          id: pageId,
          userId: this.userId,
          docRooms: this.docRooms
        });

        // Get the position from the NodeRange object
        const lastValidPos = pageNode.content.size;

        if (parentId && documentRoom && participant && position === null) {
          await participant.handleDiff(
            {
              type: 'diff',
              ds: generateInsertNestedPageDiffs({ pageId, pos: lastValidPos }),
              doc: documentRoom.doc.content,
              c: participant.messages.client,
              s: participant.messages.server,
              v: documentRoom.doc.version,
              rid: 0,
              cid: -1
            },
            {
              socketEvent: 'page_restored'
            }
          );
        } else {
          if (parentId && position === null) {
            await applyDiffAndSaveDocument({
              content,
              userId: this.userId,
              parentId,
              diffs: generateInsertNestedPageDiffs({ pageId, pos: lastValidPos })
            });
          }

          await archivePages({
            pageIds: [pageId],
            userId: this.userId,
            spaceId,
            archive: false
          });
        }
      } catch (error) {
        const errorMessage = 'Error restoring a page from archive state';
        log.error(errorMessage, {
          error,
          pageId: message.payload.id,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_created' && this.userId) {
      let childPageId: null | string = null;
      try {
        const createdPage = await createPage({
          data: {
            ...(message.payload as Prisma.PageUncheckedCreateInput),
            createdBy: this.userId,
            updatedBy: this.userId
          }
        });

        await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
          event: 'created',
          pageId: createdPage.id
        });

        const { content, contentText, ...newPageToNotify } = createdPage;

        relay.broadcast(
          {
            type: 'pages_created',
            payload: [newPageToNotify]
          },
          createdPage.spaceId
        );

        childPageId = createdPage.id;

        const {
          pageNode,
          documentRoom,
          participant,
          parentId,
          content: parentPageContent
        } = await getPageDetails({
          id: createdPage.id,
          userId: this.userId,
          docRooms: this.docRooms
        });

        if (!parentId) {
          return null;
        }

        const lastValidPos = pageNode.content.size;
        if (documentRoom && participant) {
          await participant.handleDiff(
            {
              type: 'diff',
              ds: generateInsertNestedPageDiffs({ pageId: childPageId, pos: lastValidPos }),
              doc: documentRoom.doc.content,
              c: participant.messages.client,
              s: participant.messages.server,
              v: documentRoom.doc.version,
              rid: 0,
              cid: -1
            },
            {
              socketEvent: 'page_created'
            }
          );
        } else {
          await applyDiffAndSaveDocument({
            content: parentPageContent,
            userId: this.userId,
            parentId,
            diffs: parentId ? generateInsertNestedPageDiffs({ pageId: createdPage.id, pos: lastValidPos }) : []
          });
        }

        if (typeof callback === 'function') {
          callback(createdPage);
        }
      } catch (error) {
        const errorMessage = 'Error creating a page and adding it to parent page content';
        log.error(errorMessage, {
          error,
          pageId: childPageId,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    }
  }

  sendError(message: string) {
    this.socket.emit(this.socketEvent, { type: 'error', message });
  }
}

function generateInsertNestedPageDiffs({ pageId, pos }: { pageId: string; pos: number }): ProsemirrorJSONStep[] {
  return [
    {
      stepType: 'replace',
      from: pos,
      to: pos,
      slice: {
        content: [
          {
            type: 'paragraph',
            content: [],
            attrs: {
              path: null,
              track: []
            }
          }
        ]
      }
    },
    {
      stepType: 'replace',
      from: pos,
      to: pos,
      slice: {
        content: [
          {
            type: 'page',
            attrs: {
              id: pageId,
              type: null,
              path: null,
              track: []
            }
          }
        ]
      }
    }
  ];
}

async function applyDiffAndSaveDocument({
  content,
  userId,
  parentId,
  diffs
}: {
  content: PageContent;
  userId: string;
  parentId: string;
  diffs: ProsemirrorJSONStep[];
}) {
  const pageNode = getNodeFromJson(content);

  const updatedNode = applyStepsToNode(diffs, pageNode);

  await prisma.page.update({
    where: { id: parentId },
    data: {
      content: updatedNode.toJSON(),
      contentText: updatedNode.textContent,
      hasContent: updatedNode.textContent.length > 0,
      updatedAt: new Date(),
      updatedBy: userId
    }
  });
}

async function getPageDetails({
  id,
  userId,
  docRooms
}: {
  docRooms: Map<string | undefined, DocumentRoom>;
  userId: string;
  id: string;
}) {
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      parentId: true,
      spaceId: true
    }
  });

  const parentPage = page.parentId
    ? await prisma.page.findUniqueOrThrow({
        where: {
          id: page.parentId
        },
        select: {
          content: true
        }
      })
    : null;

  const { parentId, spaceId } = page;

  const documentRoom = parentId ? docRooms.get(parentId) : null;
  const content: PageContent =
    documentRoom && documentRoom.participants.size !== 0
      ? documentRoom.node.toJSON()
      : parentPage?.content ?? emptyDocument;
  let position: null | number = null;
  let participant: DocumentEventHandler | null = null;

  const pageNode = getNodeFromJson(content);

  // get the last position of the page node prosemirror node
  if (documentRoom) {
    const participants = Array.from(documentRoom.participants.values());
    // Use the first participant if the user who triggered space event is not one of the participants
    participant =
      participants.find(
        // Send the userId using payload for now
        (_participant) => _participant.getSessionMeta().userId === userId
      ) ?? participants[0];
  }

  // Find the position of the referenced page node in the parent page content
  pageNode.forEach((node, nodePos) => {
    if (node.type.name === 'page' && node.attrs.id === id) {
      position = nodePos;
      return false;
    }
  });

  return {
    pageNode,
    documentRoom,
    participant,
    spaceId,
    parentId,
    position,
    content
  };
}
