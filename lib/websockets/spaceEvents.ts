import { UndesirableOperationError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { resolvePageTree } from '@charmverse/core/pages';
import type { PermissionsClient } from '@charmverse/core/permissions';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/constants';
import { ActionNotPermittedError } from 'lib/middleware';
import { archivePages } from 'lib/pages/archivePages';
import { createPage } from 'lib/pages/server/createPage';
import { getPermissionsClient, premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { authSecret } from 'lib/session/config';
import type { ClientMessage, SealedUserId } from 'lib/websockets/interfaces';

import type { DocumentRoom } from './documentEvents/docRooms';
import type { DocumentEventHandler } from './documentEvents/documentEvents';
import type { ProsemirrorJSONStep } from './documentEvents/interfaces';
import type { AbstractWebsocketBroadcaster } from './interfaces';

export class SpaceEventHandler {
  socketEvent = 'message';

  userId: string | null = null;

  docRooms: Map<string | undefined, DocumentRoom> = new Map();

  spaceId: string | null = null;

  private relay: AbstractWebsocketBroadcaster;

  private permissionsClient?: PermissionsClient;

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
          this.spaceId = message.payload.spaceId;
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
    } else if (message.type === 'page_deleted' && this.userId && this.spaceId) {
      const pageId = message.payload.id;

      const page = await prisma.page.findUniqueOrThrow({
        where: {
          id: pageId
        },
        select: {
          parentId: true,
          type: true
        }
      });

      await this.checkUserCanDeletePage({
        pageId,
        parentId: page.parentId
      });

      if (page.parentId) {
        await this.removeChildPageNodeFromPage({
          childPageId: pageId,
          pageId: page.parentId,
          event: 'page_deleted'
        });
      } else {
        await archivePages({
          pageIds: [pageId],
          userId: this.userId,
          spaceId: this.spaceId,
          archive: true,
          relay: this.relay
        });
      }
    } else if (message.type === 'page_restored' && this.userId && this.spaceId) {
      const pageId = message.payload.id;

      await this.checkUserCanDeletePage({
        pageId
      });

      try {
        const page = await prisma.page.findUniqueOrThrow({
          where: {
            id: pageId
          },
          select: {
            parentId: true,
            type: true
          }
        });

        let unarchivedPage = false;

        if (page.parentId) {
          const pageDetails = await this.getPageDetails({
            childPageId: pageId,
            pageId: page.parentId
          });

          const { documentNode, documentRoom, participant, content, position } = pageDetails;
          // Get the position from the NodeRange object
          const lastValidPos = documentNode.content.size;

          if (documentRoom && participant && position === null) {
            await participant.handleDiff(
              {
                type: 'diff',
                ds: SpaceEventHandler.generateInsertNestedPageDiffs({ pageId, pos: lastValidPos }),
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
            unarchivedPage = true;
          } else if (position === null) {
            await this.applyDiffAndSaveDocument({
              content,
              pageId: page.parentId,
              diffs: SpaceEventHandler.generateInsertNestedPageDiffs({ pageId, pos: lastValidPos })
            });
          }
        }

        if (!unarchivedPage) {
          await archivePages({
            pageIds: [pageId],
            userId: this.userId,
            spaceId: this.spaceId,
            archive: false,
            relay: this.relay
          });
        }
      } catch (error) {
        const errorMessage = 'Error restoring a page from archive state';
        log.error(errorMessage, {
          error,
          pageId: message.payload.id,
          userId: this.userId,
          message
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

        childPageId = createdPage.id;

        if (createdPage.parentId) {
          const pageDetails = await this.getPageDetails({
            childPageId: createdPage.id,
            pageId: createdPage.parentId
          });

          const { documentNode, documentRoom, participant, content } = pageDetails;
          const lastValidPos = documentNode.content.size;
          if (documentRoom && participant) {
            await participant.handleDiff(
              {
                type: 'diff',
                ds: SpaceEventHandler.generateInsertNestedPageDiffs({ pageId: childPageId, pos: lastValidPos }),
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
            await this.applyDiffAndSaveDocument({
              content,
              pageId: createdPage.parentId,
              diffs: SpaceEventHandler.generateInsertNestedPageDiffs({ pageId: createdPage.id, pos: lastValidPos })
            });
          }
        }

        const { content, contentText, ...newPageToNotify } = createdPage;

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
          userId: this.userId,
          message
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_reordered_sidebar_to_sidebar' && this.userId && this.spaceId) {
      const { pageId, newParentId } = message.payload;

      // don't continue if the page is being nested under itself
      if (pageId === newParentId) {
        return null;
      }

      try {
        const page = await prisma.page.findFirstOrThrow({
          where: {
            id: pageId
          },
          select: {
            id: true,
            parentId: true,
            type: true,
            path: true
          }
        });

        const pagePath = page.path;
        const pageType = page.type;
        const currentParentId = page.parentId;

        // If the page is dropped on the same parent page or on itself, do nothing
        if (currentParentId === newParentId) {
          return null;
        }

        const { flatChildren } = await resolvePageTree({
          pageId,
          flattenChildren: true
        });

        if (flatChildren.some((p) => p.id === newParentId)) {
          throw new UndesirableOperationError(`You cannot reposition a page to be a child of one of its child pages`);
        }

        // Remove reference from parent's content
        if (currentParentId) {
          await this.removeChildPageNodeFromPage({
            childPageId: pageId,
            pageId: currentParentId,
            event: 'page_reordered'
          });
        }

        // Add reference to page in the new parent page content
        if (newParentId) {
          const pageDetails = await this.getPageDetails({
            childPageId: pageId,
            pageId: newParentId
          });

          const { documentNode, documentRoom, participant, position, content } = pageDetails;
          const lastValidPos = documentNode.content.size;

          // If position is not null then the page is present in the parent page content, so no need to add it again
          if (position === null) {
            if (documentRoom && participant) {
              await participant.handleDiff(
                {
                  type: 'diff',
                  ds: SpaceEventHandler.generateInsertNestedPageDiffs({
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
              await this.applyDiffAndSaveDocument({
                content,
                pageId: newParentId,
                diffs: SpaceEventHandler.generateInsertNestedPageDiffs({
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
          userId: this.userId,
          message
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_reordered_sidebar_to_editor' && this.userId && this.spaceId) {
      const { pageId, newParentId, dropPos } = message.payload;

      // don't continue if the page is being nested under itself
      if (pageId === newParentId) {
        return null;
      }
      try {
        const page = await prisma.page.findFirstOrThrow({
          where: {
            id: pageId
          },
          select: {
            id: true,
            parentId: true,
            type: true,
            path: true
          }
        });

        const pagePath = page.path;
        const pageType = page.type;
        const currentParentId = page.parentId;

        // If the page is dropped on the same parent page or on itself, do nothing
        if (currentParentId === newParentId) {
          return null;
        }

        const { flatChildren } = await resolvePageTree({
          pageId,
          flattenChildren: true
        });

        if (flatChildren.some((p) => p.id === newParentId)) {
          throw new UndesirableOperationError(`You cannot reposition a page to be a child of one of its child pages`);
        }

        // Remove reference from parent's content
        if (currentParentId) {
          await this.removeChildPageNodeFromPage({
            childPageId: pageId,
            pageId: currentParentId,
            event: 'page_reordered'
          });
        }

        // Add reference to page in the new parent page content
        const pageDetails = await this.getPageDetails({
          childPageId: pageId,
          pageId: newParentId
        });

        const { documentNode, documentRoom, participant, position, content } = pageDetails;
        const lastValidPos = dropPos ?? documentNode.content.size;

        if (position === null) {
          if (documentRoom && participant) {
            await participant.handleDiff(
              {
                type: 'diff',
                ds: SpaceEventHandler.generateInsertNestedPageDiffs({
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
            await this.applyDiffAndSaveDocument({
              content,
              pageId: newParentId,
              diffs: SpaceEventHandler.generateInsertNestedPageDiffs({
                pageId,
                pos: lastValidPos,
                path: pagePath,
                type: pageType
              })
            });
          }
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
            payload: [{ id: pageId, parentId: newParentId, spaceId: this.spaceId }]
          },
          this.spaceId
        );
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
          userId: this.userId,
          message
        });
        this.sendError(errorMessage);
      }
    } else if (message.type === 'page_reordered_editor_to_editor' && this.userId && this.spaceId) {
      const { currentParentId, dragNodePos, pageId, newParentId, draggedNode } = message.payload;

      const isLinkedPage = draggedNode?.type === 'linkedPage';
      const isStaticPage = !!STATIC_PAGES.find((c) => c.path === pageId);
      const isForumCategory = draggedNode?.attrs?.type === 'forum_category';

      if (pageId === newParentId) {
        return null;
      }

      const page =
        isStaticPage || isForumCategory
          ? null
          : await prisma.page.findFirst({
              where: {
                id: pageId
              },
              select: {
                id: true,
                type: true,
                path: true
              }
            });

      const pagePath = (isStaticPage ? pageId : isForumCategory ? draggedNode?.attrs?.path : page?.path) ?? null;
      const pageType = (isStaticPage ? pageId : isForumCategory ? draggedNode?.attrs?.type : page?.type) ?? null;

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
        await this.removeChildPageNodeFromPage({
          childPageId: pageId,
          pageId: currentParentId,
          event: 'page_reordered',
          nodePos: dragNodePos
        });

        const pageDetails = await this.getPageDetails({
          childPageId: pageId,
          pageId: newParentId
        });

        const { documentNode, documentRoom, participant, position, content } = pageDetails;
        const lastValidPos = documentNode.content.size;

        if (position === null) {
          if (documentRoom && participant) {
            await participant.handleDiff(
              {
                type: 'diff',
                ds: SpaceEventHandler.generateInsertNestedPageDiffs({
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
            await this.applyDiffAndSaveDocument({
              content,
              pageId: newParentId,
              diffs: SpaceEventHandler.generateInsertNestedPageDiffs({
                pageId,
                pos: lastValidPos,
                isLinkedPage,
                path: pagePath,
                type: pageType
              })
            });
          }
        }

        if (!isLinkedPage && !isStaticPage && !isForumCategory) {
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
              payload: [{ id: pageId, parentId: newParentId, spaceId: this.spaceId }]
            },
            this.spaceId
          );
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
          userId: this.userId,
          message
        });
        this.sendError(errorMessage);
      }
    }
  }

  async getPageDetails({ pageId, childPageId }: { pageId: string; childPageId: string }) {
    const page = await prisma.page.findUniqueOrThrow({
      where: {
        id: pageId
      },
      select: {
        type: true,
        content: true
      }
    });

    const documentRoom = this.docRooms.get(pageId);
    const content: PageContent =
      documentRoom && documentRoom.participants.size !== 0
        ? documentRoom.node.toJSON()
        : page?.content ?? emptyDocument;
    let position: null | number = null;
    let participant: DocumentEventHandler | null = null;

    const documentNode = getNodeFromJson(content);

    // get the last position of the page node prosemirror node
    if (documentRoom) {
      const participants = Array.from(documentRoom.participants.values());
      // Use the first participant if the user who triggered space event is not one of the participants
      participant =
        participants.find(
          // Send the userId using payload for now
          (_participant) => _participant.getSessionMeta().userId === this.userId
        ) ?? participants[0];
    }

    // Find the position of the referenced page node in the parent page content
    documentNode.descendants((node, nodePos) => {
      if (node.type.name === 'page' && node.attrs.id === childPageId) {
        position = nodePos;
        return false;
      }
    });

    return {
      documentNode,
      documentRoom,
      participant,
      position,
      content
    };
  }

  sendError(message: string) {
    this.socket.emit(this.socketEvent, { type: 'error', message });
  }

  async removeChildPageNodeFromPage({
    event,
    pageId,
    nodePos,
    childPageId
  }: {
    childPageId: string;
    event: 'page_deleted' | 'page_reordered';
    pageId: string;
    nodePos?: number;
  }) {
    try {
      const pageDetails = await this.getPageDetails({
        childPageId,
        pageId
      });

      if (!pageDetails) {
        return;
      }

      const { documentRoom, participant, content, position: _nodePos } = pageDetails;
      const position = nodePos ?? _nodePos;

      if (documentRoom && participant && position !== null) {
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
        if (position !== null) {
          await this.applyDiffAndSaveDocument({
            content,
            pageId,
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
        if (event === 'page_deleted') {
          await archivePages({
            pageIds: [childPageId],
            userId: this.userId!,
            spaceId: this.spaceId!,
            archive: true,
            relay: this.relay
          });
        }
      }
    } catch (error) {
      const errorMessage = 'Error deleting a page after link was deleted from its parent page';
      log.error(errorMessage, {
        error,
        pageId: childPageId,
        userId: this.userId!
      });
      this.sendError(errorMessage);
    }
  }

  async checkUserCanDeletePage({ pageId, parentId }: { pageId: string; parentId?: string | null }): Promise<void> {
    const permissionsClient =
      this.permissionsClient ??
      (
        await getPermissionsClient({
          resourceId: pageId,
          resourceIdType: 'page'
        })
      ).client;

    if (!this.permissionsClient) {
      this.permissionsClient = permissionsClient;
    }

    const childPagePermissions = await permissionsClient.pages.computePagePermissions({
      resourceId: pageId,
      userId: this.userId as string
    });

    let canDelete = childPagePermissions.edit_content || childPagePermissions.delete;

    if (!canDelete && parentId) {
      const parentPagePermissions = await permissionsClient.pages.computePagePermissions({
        resourceId: parentId,
        userId: this.userId as string
      });

      canDelete = parentPagePermissions.edit_content || parentPagePermissions.delete;
    }

    if (!canDelete) {
      throw new ActionNotPermittedError('You cannot delete this page');
    }
  }

  async applyDiffAndSaveDocument({
    content,
    pageId,
    diffs
  }: {
    content: PageContent;
    pageId: string;
    diffs: ProsemirrorJSONStep[];
  }) {
    const pageNode = getNodeFromJson(content);
    const updatedNode = applyStepsToNode(diffs, pageNode);
    await prisma.page.update({
      where: { id: pageId },
      data: {
        content: updatedNode.toJSON(),
        contentText: updatedNode.textContent,
        hasContent: updatedNode.textContent.length > 0,
        updatedAt: new Date(),
        updatedBy: this.userId!
      }
    });
  }

  static generateInsertNestedPageDiffs({
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
}
