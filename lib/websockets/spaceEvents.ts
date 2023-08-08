import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { authSecret } from 'lib/session/config';
import type { ClientMessage, SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

import type { DocumentEventHandler } from './documentEvents/documentEvents';
import { docRooms } from './documentEvents/documentEvents';

export class SpaceEventHandler {
  socketEvent = 'message';

  userId: string | null = null;

  constructor(private socket: Socket) {
    this.socket = socket;
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
          userId: this.userId
        });

        if (documentRoom && participant && position !== null) {
          // TODO: Should this be handleDiff or handleMessage?
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
        } else if (parentId) {
          // If the user is not in the document or the position of the page node is not found (present in sidebar)
          await applyNestedPageReplaceDiffAndSaveDocument({
            deletedPageId: message.payload.id,
            content,
            parentId,
            userId: this.userId,
            spaceId
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
        const { pageNode, documentRoom, participant, parentId, content, spaceId } = await getPageDetails({
          id: pageId,
          userId: this.userId
        });

        // get the last position of the page node prosemirror node
        const lastChild = pageNode.lastChild;
        const lastChildPos = lastChild ? pageNode.content.size - lastChild.nodeSize : 0;
        if (documentRoom && participant) {
          await participant.handleDiff(
            {
              type: 'diff',
              ds: [
                {
                  stepType: 'replace',
                  from: lastChildPos,
                  to: lastChildPos + 2,
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
              ],
              doc: documentRoom.doc.content,
              c: participant.messages.client,
              s: participant.messages.server,
              v: documentRoom.doc.version,
              rid: 0,
              cid: -1
            },
            {
              restorePage: true,
              skipSendingToActor: false
            }
          );
        } else if (parentId) {
          await applyNestedPageRestoreDiffAndSaveDocument({
            restoredPageId: message.payload.id,
            content,
            userId: this.userId,
            parentId,
            spaceId
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

async function applyNestedPageRestoreDiffAndSaveDocument({
  restoredPageId,
  content,
  userId,
  parentId,
  spaceId
}: {
  restoredPageId: string;
  content: PageContent;
  userId: string;
  parentId: string;
  spaceId: string;
}) {
  const pageNode = getNodeFromJson(content);
  const lastChild = pageNode.lastChild;
  const lastChildPos = lastChild ? pageNode.content.size - lastChild.nodeSize : 0;

  const updatedNode = applyStepsToNode(
    [
      {
        stepType: 'replace',
        from: lastChildPos,
        to: lastChildPos + 2,
        slice: {
          content: [
            {
              type: 'page',
              attrs: {
                id: restoredPageId,
                type: null,
                path: null,
                track: []
              }
            }
          ]
        }
      }
    ],
    pageNode
  );

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

  const modifiedChildPageIds = await modifyChildPages(restoredPageId, userId, 'restore');
  relay.broadcast(
    {
      type: 'pages_restored',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    spaceId
  );
}

async function applyNestedPageReplaceDiffAndSaveDocument({
  deletedPageId,
  content,
  userId,
  parentId,
  spaceId
}: {
  deletedPageId: string;
  content: PageContent;
  userId: string;
  parentId: string;
  spaceId: string;
}) {
  const pageNode = getNodeFromJson(content);
  let position: null | number = null;

  pageNode.forEach((node, nodePos) => {
    if (node.type.name === 'page' && node.attrs.id === deletedPageId) {
      position = nodePos;
      return false;
    }
  });

  if (position !== null) {
    const updatedNode = applyStepsToNode(
      [
        {
          from: position,
          to: position + 1,
          stepType: 'replace'
        }
      ],
      pageNode
    );

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

  const modifiedChildPageIds = await modifyChildPages(deletedPageId, userId, 'archive');
  relay.broadcast(
    {
      type: 'pages_deleted',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    spaceId
  );
}

async function getPageDetails({ id, userId }: { userId: string; id: string }) {
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
  const content = (parentPage?.content ?? emptyDocument) as PageContent;
  const documentRoom = parentId ? docRooms.get(parentId) : null;
  let participant: DocumentEventHandler | null = null;
  let position: null | number = null;

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

    documentRoom.node.forEach((node, nodePos) => {
      if (node.type.name === 'page' && node.attrs.id === id) {
        position = nodePos;
        return false;
      }
    });
  }

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
