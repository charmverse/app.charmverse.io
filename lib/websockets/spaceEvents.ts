import { UndesirableOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { resolvePageTree } from '@charmverse/core/pages';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { documentTypes } from 'components/common/PageActions/components/DocumentPageActionList';
import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
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

          if (spaceId) {
            await archivePages({
              pageIds: [pageId],
              userId: this.userId,
              spaceId,
              archive: false,
              relay: this.relay
            });
          }
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

        const { content, contentText, ...newPageToNotify } = createdPage;

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

        if (parentId) {
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
        }

        this.relay.broadcast(
          {
            type: 'pages_created',
            payload: [newPageToNotify]
          },
          createdPage.spaceId
        );

        await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
          event: 'created',
          pageId: createdPage.id
        });

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
    } else if (message.type === 'page_reordered_sidebar_to_sidebar' && this.userId) {
      const { pageId, newParentId } = message.payload;

      // don't continue if the page is being nested under itself
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

      const pagePath = page.path;
      const pageType = page.type;

      const currentParentId = page.parentId;

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
        if (currentParentId) {
          const parentPage = newParentId
            ? await prisma.page.findUnique({
                where: { id: newParentId },
                select: {
                  type: true
                }
              })
            : null;

          if (parentPage && !documentTypes.includes(parentPage.type)) {
            return;
          }

          await handlePageRemoveMessage({
            userId: this.userId,
            docRooms: this.docRooms,
            payload: {
              id: pageId
            },
            parentId: currentParentId,
            sendError: this.sendError,
            event: 'page_reordered',
            relay: this.relay
          });
        }

        // Add reference to page in the new parent page content
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
          const lastValidPos = parentDocumentNode.content.size;

          // If position is not null then the page is present in the parent page content
          if (position === null) {
            if (documentRoom && participant) {
              await participant.handleDiff(
                {
                  type: 'diff',
                  ds: generateInsertNestedPageDiffs({
                    pageId,
                    pos: lastValidPos,
                    path: pagePath,
                    type: pageType
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
                  path: pagePath,
                  type: pageType
                })
              });
            }
          }
        }

        await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
          event: 'repositioned',
          pageId
        });
      } catch (error) {
        const errorMessage = 'Error repositioning a page from the sidebar to another page in the sidebar';
        log.error(errorMessage, {
          error,
          pageId,
          newParentId,
          currentParentId,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_reordered_sidebar_to_editor' && this.userId) {
      const { pageId, newParentId, dropPos } = message.payload;

      // don't continue if the page is being nested under itself
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

      const pagePath = page.path;
      const pageType = page.type;

      const currentParentId = page.parentId;

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
        if (currentParentId) {
          const parentPage = newParentId
            ? await prisma.page.findUnique({
                where: { id: newParentId },
                select: {
                  type: true
                }
              })
            : null;

          if (parentPage && !documentTypes.includes(parentPage.type)) {
            return;
          }

          await handlePageRemoveMessage({
            userId: this.userId,
            docRooms: this.docRooms,
            payload: {
              id: pageId
            },
            parentId: currentParentId,
            sendError: this.sendError,
            event: 'page_reordered',
            relay: this.relay
          });
        }

        // Add reference to page in the new parent page content
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
                    path: pagePath,
                    type: pageType
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
                  path: pagePath,
                  type: pageType
                })
              });
            }

            // Since this was not dropped in sidebar the auto update and broadcast won't be triggered from the frontend
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
        await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
          event: 'repositioned',
          pageId
        });
      } catch (error) {
        const errorMessage = 'Error repositioning a page from the sidebar to another page in the editor';
        log.error(errorMessage, {
          error,
          pageId,
          newParentId,
          currentParentId,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_reordered_editor_to_editor' && this.userId) {
      const { currentParentId: _currentParentId, dragNodePos, pageId, newParentId, draggedNode } = message.payload;

      const isLinkedPage = draggedNode?.type === 'linkedPage';
      const isStaticPage = !!STATIC_PAGES.find((c) => c.path === pageId);
      const isForumCategory = draggedNode?.attrs?.type === 'forum_category';

      if (pageId === newParentId) {
        return null;
      }

      const page = isStaticPage
        ? null
        : await prisma.page.findFirst({
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

      if (!page && !isStaticPage && !isForumCategory) {
        return null;
      }

      const pagePath = (isStaticPage ? pageId : isForumCategory ? draggedNode?.attrs?.path : page?.path) ?? null;
      const pageType = (isStaticPage ? pageId : isForumCategory ? draggedNode?.attrs?.type : page?.type) ?? null;

      const currentParentId = _currentParentId ?? page?.parentId ?? null;

      // If the page is dropped on the same parent page or on itself, do nothing
      if (currentParentId === newParentId) {
        return null;
      }

      try {
        if (!isLinkedPage) {
          const { flatChildren } = await resolvePageTree({
            pageId,
            flattenChildren: true
          });

          if (flatChildren.some((p) => p.id === newParentId)) {
            throw new UndesirableOperationError(`You cannot reposition a page to be a child of one of its child pages`);
          }
        }

        // Remove reference from parent's content
        if (currentParentId) {
          const parentPage = newParentId
            ? await prisma.page.findUnique({
                where: { id: newParentId },
                select: {
                  type: true
                }
              })
            : null;

          if (parentPage && !documentTypes.includes(parentPage.type)) {
            return;
          }

          await handlePageRemoveMessage({
            userId: this.userId,
            docRooms: this.docRooms,
            payload: {
              id: pageId
            },
            parentId: currentParentId,
            sendError: this.sendError,
            event: 'page_reordered',
            relay: this.relay,
            nodePos: dragNodePos,
            isStaticPage: isStaticPage || isForumCategory
          });
        }

        // Add reference to page in the new parent page content
        if (newParentId) {
          const pageDetails = await getPageDetails({
            id: pageId,
            userId: this.userId,
            docRooms: this.docRooms,
            parentId: newParentId,
            isStaticPage: isStaticPage || isForumCategory
          });

          if (!pageDetails) {
            return;
          }

          const { parentDocumentNode, documentRoom, participant, position, content: parentPageContent } = pageDetails;
          const lastValidPos = parentDocumentNode.content.size;

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
                    path: pagePath,
                    type: pageType
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
                  path: pagePath,
                  type: pageType
                })
              });
            }

            // Since this was not dropped in sidebar the auto update and broadcast won't be triggered from the frontend
            if (!isLinkedPage && page) {
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

        if (!isLinkedPage) {
          await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
            event: 'repositioned',
            pageId
          });
        }
      } catch (error) {
        const errorMessage = 'Error repositioning a page in parent page content';
        log.error(errorMessage, {
          error,
          pageId,
          newParentId,
          currentParentId,
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
  nodePos,
  parentId: _parentId,
  isStaticPage
}: {
  isStaticPage?: boolean;
  parentId?: string;
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
      docRooms,
      parentId: _parentId,
      isStaticPage
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

        if (event === 'page_deleted' && spaceId) {
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
  parentId,
  isStaticPage
}: {
  docRooms: Map<string | undefined, DocumentRoom>;
  userId: string;
  id: string;
  parentId?: string;
  isStaticPage?: boolean;
}) {
  const page = !isStaticPage
    ? await prisma.page.findUniqueOrThrow({
        where: {
          id
        },
        select: {
          parentId: true,
          spaceId: true,
          type: true
        }
      })
    : null;

  const _parentId = parentId ?? page?.parentId;

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

  if (parentPage && !documentTypes.includes(parentPage.type)) {
    return null;
  }

  const spaceId = page?.spaceId;

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
