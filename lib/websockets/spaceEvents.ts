import { UndesirableOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { resolvePageTree } from '@charmverse/core/pages';
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
import type { ClientMessage, SealedUserId, WebSocketPayload } from 'lib/websockets/interfaces';

import type { DocumentRoom } from './documentEvents/docRooms';
import type { DocumentEventHandler } from './documentEvents/documentEvents';
import type { ProsemirrorJSONStep } from './documentEvents/interfaces';
import type { AbstractWebsocketBroadcaster } from './interfaces';

export class SpaceEventHandler {
  socketEvent = 'message';

  userId: string | null = null;

  docRooms: Map<string | undefined, DocumentRoom> = new Map();

  private relay: AbstractWebsocketBroadcaster;

  constructor(
    relay: AbstractWebsocketBroadcaster,
    private socket: Socket,
    docRooms: Map<string | undefined, DocumentRoom>
  ) {
    this.relay = relay;
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
          this.relay.registerWorkspaceSubscriber({
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
      await handlePageRemoveMessage({
        userId: this.userId,
        docRooms: this.docRooms,
        payload: message.payload,
        sendError: this.sendError,
        event: 'page_deleted',
        relay: this.relay
      });
    } else if (message.type === 'page_restored' && this.userId) {
      const pageId = message.payload.id;

      try {
        const pageDetails = await getPageDetails({
          id: pageId,
          userId: this.userId,
          docRooms: this.docRooms
        });

        if (!pageDetails) {
          return;
        }

        const { parentDocumentNode, documentRoom, participant, parentId, spaceId, content, position } = pageDetails;

        // Get the position from the NodeRange object
        const lastValidPos = parentDocumentNode.content.size;

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
            archive: false,
            relay: this.relay
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

        this.relay.broadcast(
          {
            type: 'pages_created',
            payload: [newPageToNotify]
          },
          createdPage.spaceId
        );

        childPageId = createdPage.id;

        const pageDetails = await getPageDetails({
          id: createdPage.id,
          userId: this.userId,
          docRooms: this.docRooms
        });

        if (!pageDetails) {
          return;
        }

        const { parentDocumentNode, documentRoom, participant, parentId, content: parentPageContent } = pageDetails;

        if (!parentId) {
          if (typeof callback === 'function') {
            callback(createdPage);
          }
          return null;
        }

        const lastValidPos = parentDocumentNode.content.size;
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
    } else if (message.type === 'page_reordered' && this.userId) {
      const { dragPos, isLinkedPage, pageId, newParentId, newIndex, trigger, dropPos } = message.payload;
      if (pageId === newParentId) {
        return null;
      }

      const page = await prisma.page.findFirst({
        where: {
          id: pageId
        },
        select: {
          id: true,
          spaceId: true,
          parentId: true,
          type: true,
          path: true
        }
      });

      if (!page) {
        return null;
      }

      const currentParentId = page.parentId ?? null;

      // If the page is dropped on the same parent page or on itself, do nothing
      if (currentParentId === newParentId) {
        return null;
      }

      try {
        const { flatChildren } = await resolvePageTree({
          pageId,
          flattenChildren: true
        });

        if (flatChildren.some((p) => p.id === newParentId)) {
          throw new UndesirableOperationError(`You cannot reposition a page to be a child of one of its child pages`);
        }

        // Remove reference from parent's content
        // TODO: if trigger is editor-to-editor make sure the new parent is of valid content type
        if (currentParentId) {
          await handlePageRemoveMessage({
            userId: this.userId,
            docRooms: this.docRooms,
            payload: {
              id: pageId
            },
            sendError: this.sendError,
            event: 'page_reordered',
            relay: this.relay,
            nodePos: dragPos
          });
        }

        if (newParentId) {
          const pageDetails = await getPageDetails({
            id: pageId,
            userId: this.userId,
            docRooms: this.docRooms,
            parentId: newParentId
          });

          if (!pageDetails) {
            return;
          }

          const { parentDocumentNode, documentRoom, participant, position, content: parentPageContent } = pageDetails;
          const lastValidPos = dropPos ?? parentDocumentNode.content.size;

          // If position is not null then the page is present in the parent page content
          if (position === null) {
            if (documentRoom && participant) {
              await participant.handleDiff(
                {
                  type: 'diff',
                  ds: generateInsertNestedPageDiffs({
                    pageId,
                    pos: lastValidPos,
                    isLinkedPage,
                    path: page.path,
                    type: page.type
                  }),
                  doc: documentRoom.doc.content,
                  c: participant.messages.client,
                  s: participant.messages.server,
                  v: documentRoom.doc.version,
                  rid: 0,
                  cid: -1
                },
                {
                  socketEvent: 'page_reordered'
                }
              );
            } else {
              await applyDiffAndSaveDocument({
                content: parentPageContent,
                userId: this.userId,
                parentId: newParentId,
                diffs: generateInsertNestedPageDiffs({
                  pageId,
                  pos: lastValidPos,
                  isLinkedPage,
                  path: page.path,
                  type: page.type
                })
              });
            }

            // Since this was not dropped in sidebar the auto update and broadcast won't be triggered from the frontend
            if ((trigger === 'sidebar-to-editor' || trigger === 'editor-to-editor') && !isLinkedPage) {
              await prisma.page.update({
                where: {
                  id: pageId
                },
                data: {
                  parentId: newParentId
                }
              });

              this.relay.broadcast(
                {
                  type: 'pages_meta_updated',
                  payload: [{ id: pageId, parentId: newParentId, spaceId: page.spaceId }]
                },
                page.spaceId
              );
            }
          }
        }

        await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
          event: 'repositioned',
          pageId
        });
      } catch (error) {
        const errorMessage = 'Error repositioning a page in parent page content';
        log.error(errorMessage, {
          error,
          pageId,
          newParentId,
          currentParentId,
          newIndex,
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

async function handlePageRemoveMessage({
  event,
  userId,
  docRooms,
  payload,
  sendError,
  relay,
  nodePos
}: {
  event: 'page_deleted' | 'page_reordered';
  userId: string;
  docRooms: Map<string | undefined, DocumentRoom>;
  payload: WebSocketPayload<'page_deleted'>;
  sendError: (message: string) => void;
  relay: AbstractWebsocketBroadcaster;
  nodePos?: number;
}) {
  try {
    const pageId = payload.id;
    const pageDetails = await getPageDetails({
      id: pageId,
      userId,
      docRooms
    });

    if (!pageDetails) {
      return;
    }

    const { documentRoom, participant, parentId, spaceId, content, position: _nodePos } = pageDetails;
    const position = nodePos ?? _nodePos;
    if (parentId && position !== null) {
      if (documentRoom && participant) {
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
          { socketEvent: event }
        );
      } else {
        await applyDiffAndSaveDocument({
          content,
          parentId,
          userId,
          diffs: [
            {
              from: position,
              to: position + 1,
              stepType: 'replace'
            }
          ]
        });
        // If the user is not in the document or the position of the page node is not found (present in sidebar)

        if (event === 'page_deleted') {
          await archivePages({
            pageIds: [pageId],
            userId,
            spaceId,
            archive: true,
            relay
          });
        }
      }
    }
  } catch (error) {
    const errorMessage = 'Error deleting a page after link was deleted from its parent page';
    log.error(errorMessage, {
      error,
      pageId: payload.id,
      userId
    });
    sendError(errorMessage);
  }
}

function generateInsertNestedPageDiffs({
  pageId,
  pos,
  isLinkedPage,
  type = null,
  path = null
}: {
  pageId: string;
  pos: number;
  isLinkedPage?: boolean;
  type?: string | null;
  path?: string | null;
}): ProsemirrorJSONStep[] {
  return [
    {
      stepType: 'replace',
      from: pos,
      to: pos,
      slice: {
        content: [
          {
            type: isLinkedPage ? 'linkedPage' : 'page',
            attrs: {
              id: pageId,
              type,
              path,
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
  docRooms,
  parentId
}: {
  docRooms: Map<string | undefined, DocumentRoom>;
  userId: string;
  id: string;
  parentId?: string;
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

  const _parentId = parentId ?? page.parentId;

  const parentPage = _parentId
    ? await prisma.page.findUniqueOrThrow({
        where: {
          id: _parentId
        },
        select: {
          type: true,
          content: true
        }
      })
    : null;

  if (
    parentPage &&
    ['board', 'board_template', 'inline_board', 'linked_board', 'inline_linked_board'].includes(parentPage.type)
  ) {
    return null;
  }

  const { spaceId } = page;

  const documentRoom = _parentId ? docRooms.get(_parentId) : null;
  const content: PageContent =
    documentRoom && documentRoom.participants.size !== 0
      ? documentRoom.node.toJSON()
      : parentPage?.content ?? emptyDocument;
  let position: null | number = null;
  let participant: DocumentEventHandler | null = null;

  const parentDocumentNode = getNodeFromJson(content);

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
  parentDocumentNode.forEach((node, nodePos) => {
    if (node.type.name === 'page' && node.attrs.id === id) {
      position = nodePos;
      return false;
    }
  });

  return {
    parentDocumentNode,
    documentRoom,
    participant,
    spaceId,
    parentId: _parentId,
    position,
    content
  };
}
