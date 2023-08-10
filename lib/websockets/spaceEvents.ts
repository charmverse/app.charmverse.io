import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { archivePages } from 'lib/pages/archivePages';
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
    this.socket.on(this.socketEvent, async (message) => {
      try {
        await this.onMessage(message);
      } catch (error) {
        log.error('Error handling space socket message', error);
      }
    });

    this.socket.emit(this.socketEvent, { type: 'welcome' });
  }

  async onMessage(message: ClientMessage) {
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
              // TODO: How to get the correct c, s and v values?
              c: participant.messages.client,
              s: participant.messages.server,
              v: documentRoom.doc.version,
              // TODO: How to get the correct rid and cid values?
              rid: 0,
              cid: -1
            },
            { skipSendingToActor: false }
          );
        } else {
          // If the user is not in the document or the position of the page node is not found (present in sidebar)
          await applyDiffAndSaveDocument({
            pageId: message.payload.id,
            content,
            parentId,
            userId: this.userId,
            spaceId,
            diffs: position
              ? [
                  {
                    from: position,
                    to: position + 1,
                    stepType: 'replace'
                  }
                ]
              : [],
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
              // This is to indicate that it was triggered by a page_restored event
              restorePage: true,
              skipSendingToActor: false
            }
          );
        } else {
          await applyDiffAndSaveDocument({
            pageId: message.payload.id,
            content,
            userId: this.userId,
            parentId,
            spaceId,
            diffs: position !== null ? [] : generateInsertNestedPageDiffs({ pageId, pos: lastValidPos }),
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
  pageId,
  content,
  userId,
  parentId,
  spaceId,
  archive,
  diffs
}: {
  pageId: string;
  content: PageContent;
  userId: string;
  parentId?: string | null;
  spaceId: string;
  archive: boolean;
  diffs: ProsemirrorJSONStep[];
}) {
  if (parentId && diffs.length) {
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

  await archivePages({
    pageIds: [pageId],
    userId,
    spaceId,
    archive
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
