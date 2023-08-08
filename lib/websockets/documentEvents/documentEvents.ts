import type { Node } from '@bangle.dev/pm';
import { getLogger } from '@charmverse/core/log';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { Socket } from 'socket.io';
import { validate } from 'uuid';

import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { getPermissionsClient } from 'lib/permissions/api';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { emptyDocument } from 'lib/prosemirror/constants';
import { extractPreviewImage } from 'lib/prosemirror/extractPreviewImage';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { AuthenticatedSocketData } from '../authentication';
import { relay } from '../relay';

import type {
  Participant,
  ProsemirrorJSONStep,
  WrappedSocketMessage,
  ClientMessage,
  ServerDocDataMessage,
  ClientCheckVersionMessage,
  ClientDiffMessage,
  ClientSelectionMessage,
  ServerMessage,
  PatchError
} from './interfaces';

const log = getLogger('ws-docs');

type SocketSessionData = AuthenticatedSocketData & {
  documentId?: string;
  isOwner?: boolean;
  permissions: Partial<PagePermissionFlags>;
};

type DocumentRoom = {
  // eslint-disable-next-line no-use-before-define
  participants: Map<string, DocumentEventHandler>;
  doc: {
    id: string;
    spaceId: string;
    version: number;
    content: any;
    type: string;
    galleryImage: string | null;
    hasContent: boolean;
    diffs: ClientDiffMessage[];
  };
  lastSavedVersion?: number;
  node: Node;
};

export const docRooms = new Map<string | undefined, DocumentRoom>();

export class DocumentEventHandler {
  id: string;

  docSaveInterval = 1; // how often to save document to database

  historyLength = 1000; // Only keep the last 1000 diffs

  socket: Socket;

  socketEvent = 'message';

  messages: { server: number; client: number; lastTen: (ClientMessage | ServerMessage)[] } = {
    server: 0,
    client: 0,
    lastTen: []
  };

  // store session data on the socket from socket-io
  getSession() {
    return this.socket.data as SocketSessionData;
  }

  getSessionMeta() {
    const session = this.getSession();
    const docRoom = docRooms.get(session.documentId);
    return {
      socketId: this.id,
      userId: session.user?.id,
      pageId: session.documentId,
      spaceId: docRoom?.doc.spaceId,
      pageVersion: docRoom?.doc.version,
      serverMessages: this.messages.server,
      clientMessages: this.messages.client
    };
  }

  setSession(data: Partial<SocketSessionData>) {
    Object.assign(this.socket.data, data);
  }

  getDocumentRoom() {
    const docId = this.getSession().documentId;
    return docRooms.get(docId);
  }

  getDocumentRoomOrThrow() {
    const room = this.getDocumentRoom();
    if (!room) {
      throw new Error('Could not find a room for page');
    }
    return room;
  }

  constructor(socket: Socket) {
    this.id = socket.id;
    this.socket = socket;

    // set up socket data
    // this.socket.data.user is set by the authentication middleware
    this.socket.data.permissions = {}; // set empty permissions
  }

  init() {
    this.socket.on(this.socketEvent, async (message) => {
      try {
        await this.onMessage(message);
      } catch (error) {
        const logData = this.getSessionMeta();
        log.error('Error handling document event', { ...logData, error });
      }
    });

    this.socket.on('disconnect', (...args) => {
      try {
        log.debug('Closing collaboration session', { args, ...this.getSessionMeta() });
        this.onClose();
      } catch (error) {
        const logData = this.getSessionMeta();
        log.error('Error handling web socket disconnect', { ...logData, error });
      }
    });

    // this.sendMessage({ type: 'welcome' });
  }

  async onMessage(message: WrappedSocketMessage<ClientMessage>) {
    const logData = this.getSessionMeta();

    // log.debug('Received message:', { message, messages: this.messages });

    if (message.type === 'request_resend') {
      log.debug('Client requested to resend messages', logData);
      await this.resendMessages(message.from);
      return;
    }

    // Verify the order of the message
    if (!('c' in message) || !('s' in message)) {
      log.error(`Received invalid message`, { message, ...this.getSessionMeta() });
      this.sendError('Received invalid message');
      return;
    } else if (message.c < this.messages.client + 1) {
      // Receive a message already received at least once. Ignore.
      log.debug(`Ignore duplicate message from client`, {
        ...logData,
        message
      });
      // Dont know how it gets out of sync, but sometimes these are not in fact duplicate messages. And the user ends up losing all their changes as each new one is ignored.
      // check if there are at least a few updates and ask the user to refresh
      if (message.type === 'diff' && message.ds.length > 30) {
        this.sendError('Your version of this document is out of sync with the server. Please refresh the page.');
      }
      return;
    } else if (message.c > this.messages.client + 1) {
      log.warn('Request resent of lost messages from client', {
        ...logData,
        message
      });
      this.sendMessage({ type: 'request_resend', from: this.messages.client });
      return;
    } else if (message.s < this.messages.server) {
      /* Message was sent either simultaneously with message from server
         or a message from the server previously sent never arrived.
         Resend the messages the client missed. */
      log.warn('Resend messages to client', { message, messagesToSend: this.messages.lastTen.length, ...logData });
      this.messages.client += 1;
      await this.resendMessages(message.s);
      await this.rejectMessage(message);
      return;
    }

    // message order is correct. continue processing message
    this.messages.client += 1;
    try {
      await this.handleMessage(message);
    } catch (error) {
      log.error('Error handling socket message', {
        error,
        message,
        ...logData
      });
    }
  }

  async handleMessage(message: WrappedSocketMessage<ClientMessage>) {
    const session = this.getSession();

    // handle subscription to document
    if (message.type === 'subscribe') {
      log.debug('Received subscribe event', { socketId: this.id, pageId: message.roomId, userId: session.user.id });
      await this.subscribeToDoc({ pageId: message.roomId, connectionCount: message.connection });
      return;
    }

    if (!session.documentId) {
      log.warn('Ignore message because session is missing document', {
        message,
        socketId: this.id,
        userId: session.user.id
      });
      return;
    }

    if (!docRooms.has(session.documentId)) {
      log.error('Ignoring message from closed document - this is unusual', {
        socketId: this.id,
        message,
        pageId: session.documentId,
        userId: session.user.id
      });
      return;
    }

    switch (message.type) {
      case 'get_document':
        await this.sendDocument();
        break;

      case 'check_version':
        await this.checkVersion(message);
        break;

      case 'selection_change':
        await this.handleSelectionChange(message);
        break;

      case 'diff':
        if (session.permissions.edit_content || session.permissions.comment) {
          await this.handleDiff(message);
        }
        break;

      default:
        log.warn(`Unhandled socket message type: "${message.type}"`, {
          message,
          pageId: session.documentId,
          userId: session.user.id
        });
    }
  }

  async subscribeToDoc({ pageId, connectionCount = 0 }: { pageId: string; connectionCount?: number }) {
    try {
      const userId = this.getSession().user.id;

      const isValidPageId = validate(pageId);
      if (!isValidPageId) {
        throw new Error(`Invalid page id: ${pageId}`);
      }
      const permissions = await getPermissionsClient({ resourceId: pageId, resourceIdType: 'page' }).then(
        ({ client }) =>
          client.pages.computePagePermissions({
            resourceId: pageId,
            userId
          })
      );

      if (permissions.edit_content !== true && permissions.comment !== true) {
        log.warn('Denied permission to user', { permissions, pageId, userId });
        this.sendError('You do not have permission to edit this page');
        return;
      }

      this.setSession({ documentId: pageId, permissions });

      const docRoom = docRooms.get(pageId);
      if (docRoom && docRoom.participants.size > 0) {
        log.debug('Join existing document room', {
          pageId,
          userId,
          connectionCount,
          socketId: this.id,
          participants: docRoom.participants.size
        });
        docRoom.participants.set(this.id, this);
      } else {
        log.debug('Opening new document room', { socketId: this.id, pageId, userId, connectionCount });
        const page = await prisma.page.findUniqueOrThrow({
          where: { id: pageId },
          include: {
            diffs: true
          }
        });

        const content = page.content || emptyDocument;
        const participants = new Map();
        participants.set(this.id, this);

        const room: DocumentRoom = {
          doc: {
            id: page.id,
            spaceId: page.spaceId,
            content,
            type: page.type,
            galleryImage: page.galleryImage,
            hasContent: page.hasContent,
            version: page.version,
            diffs: page.diffs.map((diff) => diff.data as unknown as ClientDiffMessage)
          },
          node: getNodeFromJson(content),
          participants
        };
        docRooms.set(pageId, room);
      }

      this.sendMessage({ type: 'subscribed' });

      if (connectionCount < 1) {
        await this.sendDocument();
        log.debug('Sent document to new subscriber', {
          socketId: this.id,
          pageId,
          userId,
          pageVersion: docRooms.get(pageId)?.doc.version
        });
      }
      this.handleParticipantUpdate();
    } catch (error) {
      log.error('Error subscribing user to page', {
        error,
        socketId: this.id,
        pageId,
        userId: this.getSession().user.id
      });
      this.sendError('There was an error loading the page! Please try again later.');
    }
  }

  confirmDiff(rid: number) {
    this.sendMessage({ type: 'confirm_diff', rid });
  }

  handleParticipantUpdate() {
    this.sendParticipantList();
  }

  sendParticipantList() {
    const room = this.getDocumentRoom();
    if (room) {
      const participantList: Participant[] = [];
      room.participants.forEach((participant) => {
        const session = participant.getSession();
        participantList.push({
          id: session.user.id,
          name: session.user.name,
          session_id: participant.id
        });
      });
      this.sendUpdates({ message: { type: 'connections', participant_list: participantList } });
    }
  }

  handleSelectionChange(message: ClientSelectionMessage) {
    const room = this.getDocumentRoom();
    if (message.v === room?.doc.version) {
      this.sendUpdatesToOthers(message);
    } else {
      log.debug('Ignoring selection change because version is out of date', {
        socketId: this.id,
        pageId: room?.doc.id,
        version: message.v,
        docVersion: room?.doc.version,
        userId: this.getSession().user.id
      });
    }
  }

  // We need to filter out marks from the suggested-tooltip plugin (supports mentions, slash command, etc). This way the tooltip doesn't show up for others.
  // (Not sure this is the best fix, but it's the only way I could think of for now)
  removeTooltipMarks(diff: ProsemirrorJSONStep) {
    const content = diff.slice?.content;
    if (content) {
      for (const node of content) {
        if (node.marks?.length) {
          node.marks = node.marks.filter((mark) => !mark.attrs?.trigger);
        }
      }
    }
    return diff;
  }

  // skipSendingToActor is used when we want to send the diff to all other participants, but not the actor
  async handleDiff(
    message: WrappedSocketMessage<ClientDiffMessage>,
    { skipSendingToActor, restorePage = false }: { skipSendingToActor?: boolean; restorePage?: boolean } = {
      skipSendingToActor: true
    }
  ) {
    const room = this.getDocumentRoomOrThrow();
    const clientV = message.v;
    const serverV = room.doc.version;
    const session = this.getSession();
    const logMeta = {
      socketId: this.id,
      userId: session.user.id,
      pageId: room.doc.id,
      spaceId: room.doc.spaceId,
      v: clientV,
      c: message.c,
      s: message.s,
      serverV,
      serverC: this.messages.client,
      serverS: this.messages.server
    };
    log.debug('Handling change event', logMeta);
    const deletedPageIds: string[] = [];
    const restoredPageIds: string[] = [];

    if (clientV === serverV) {
      if (message.ds) {
        // do some pre-processing on the diffs
        message.ds = message.ds.map(this.removeTooltipMarks);
        // Go through the diffs and see if any of them are for deleting a page.
        for (const ds of message.ds) {
          if (ds.stepType === 'replace') {
            if (restorePage && ds.slice?.content) {
              ds.slice.content.forEach((node) => {
                if (node.type === 'page') {
                  restoredPageIds.push(node.attrs?.id);
                }
              });
            } else {
              const node = room.node.resolve(ds.from).nodeAfter?.toJSON() as PageContent;
              if (node && node.type === 'page') {
                const pageId = node.attrs?.id;
                if (pageId) {
                  deletedPageIds.push(pageId);
                }
              }
            }
          }
        }

        try {
          const updatedNode = applyStepsToNode(message.ds, room.node);
          room.node = updatedNode;
          room.doc.content = updatedNode.toJSON();
        } catch (error) {
          log.error('Error applying steps to node', { error, ds: message.ds, ...logMeta });
          this.unfixable();
          const patchError: PatchError = { type: 'patch_error' };
          this.sendMessage(patchError);
          // Reset collaboration to avoid any data loss issues.
          this.resetCollaboration(patchError);
          return;
        }
      }
      room.doc.diffs.push(message);
      room.doc.diffs = room.doc.diffs.slice(0 - this.historyLength);
      room.doc.version += 1;
      try {
        await this.saveDiff(message);
        if (room.doc.version % this.docSaveInterval === 0) {
          await this.saveDocument();
        }

        for (const pageId of deletedPageIds) {
          const modifiedChildPageIds = await modifyChildPages(pageId, session.user.id, 'archive');
          relay.broadcast(
            {
              type: 'pages_deleted',
              payload: modifiedChildPageIds.map((id) => ({ id }))
            },
            room.doc.spaceId
          );
        }

        for (const pageId of restoredPageIds) {
          const modifiedChildPageIds = await modifyChildPages(pageId, session.user.id, 'restore');
          relay.broadcast(
            {
              type: 'pages_restored',
              payload: modifiedChildPageIds.map((id) => ({ id }))
            },
            room.doc.spaceId
          );
        }

        this.confirmDiff(message.rid);
        this.sendUpdatesToOthers(message, skipSendingToActor);
      } catch (error) {
        log.error('Error when saving changes to the db', { error, ...logMeta });
        this.sendError('There was an error saving your changes! Please refresh and try again.');
      }
    } else if (clientV < serverV) {
      if (clientV + room.doc.diffs.length >= serverV) {
        // We have enough diffs stored to fix it.
        const diffsToSend = clientV - serverV;
        log.debug('Client is behind. Resend document diffs', {
          ...logMeta,
          roomDiffs: room.doc.diffs.length,
          diffsToSend: diffsToSend * -1
        });
        const messages = room.doc.diffs.slice(diffsToSend);
        for (const m of messages) {
          const newMessage = { ...m, server_fix: true };
          this.sendMessage(newMessage);
        }
      } else {
        log.debug('Unfixable: Client is too far behind to process update. Resend document', logMeta);
        // Client has a version that is too old to be fixed
        await this.unfixable();
      }
    } else {
      // Client has a higher version than server. Something is fishy!
      log.debug('Ignore message from user with higher document version than server', logMeta);
    }
  }

  async checkVersion(message: ClientCheckVersionMessage) {
    const session = this.getSession();
    const room = this.getDocumentRoomOrThrow();
    const clientV = message.v;
    const serverV = room?.doc.version;
    const logData = { clientV, serverV, pageId: room?.doc.id, spaceId: room?.doc.spaceId, userId: session.user.id };
    log.debug('Check version of document', logData);
    if (clientV === serverV) {
      this.sendMessage({ type: 'confirm_version', v: clientV });
    } else if (clientV + room.doc.diffs.length >= serverV) {
      const numberDiffs = clientV - serverV;
      log.debug('Resending document diffs', { numberDiffs, ...logData });
      const messages = room.doc.diffs.slice(numberDiffs);
      this.sendDocument(messages);
    } else {
      log.warn(
        'Unfixable: User is on a very old version of the document (is expected if user leaves document for a while)',
        logData
      );
      this.unfixable();
    }
  }

  unfixable() {
    return this.sendDocument();
  }

  resendMessages(from: number) {
    const toSend = this.messages.server - from;
    this.messages.server -= toSend;
    if (toSend > this.messages.lastTen.length) {
      log.warn('Unfixable: Too many messages to resend. Send full document', {
        toSend,
        from,
        ...this.getSessionMeta()
      });
      this.unfixable();
    } else {
      const lastTen = this.messages.lastTen.slice(-toSend);
      for (const message of lastTen) {
        this.sendMessage(message);
      }
    }
  }

  async sendDocument(messages?: ClientDiffMessage[]) {
    const session = this.getSession();

    if (!session.documentId) {
      log.error('Cannot send document - session is missing documentId', {
        ...this.getSessionMeta(),
        userId: session.user.id
      });
      return;
    }
    const room = this.getDocumentRoomOrThrow();

    const message: ServerDocDataMessage = {
      type: 'doc_data',
      doc: {
        content: room.doc.content,
        v: room.doc.version
      },
      docInfo: {
        id: session.documentId,
        session_id: this.id,
        version: room.doc.version
      },
      time: Date.now()
    };
    if (messages) {
      message.m = messages;
    }
    this.sendMessage(message);
  }

  rejectMessage(message: WrappedSocketMessage<ClientMessage>) {
    if (message.type === 'diff') {
      this.sendMessage({ type: 'reject_diff', rid: message.rid });
    }
  }

  sendMessage(message: ClientMessage | ServerMessage) {
    this.messages.server += 1;
    const wrappedMessage: WrappedSocketMessage<ClientMessage | ServerMessage> = {
      ...message,
      c: this.messages.client,
      s: this.messages.server
    };
    this.messages.lastTen.push(message);
    this.messages.lastTen = this.messages.lastTen.slice(-30); // changed from 10 to 30 to be safe
    try {
      this.socket.emit(this.socketEvent, wrappedMessage);
    } catch (err) {
      log.error('Error sending message', err);
    }
  }

  sendError(message: string) {
    this.sendMessage({ type: 'error', message });
  }

  async resetCollaboration(message: PatchError) {
    const room = this.getDocumentRoomOrThrow();

    log.debug('Resetting collaboration', this.getSessionMeta());

    for (const [, participant] of room.participants) {
      if (participant.id !== this.id) {
        log.warn('Unfixable: Resetting client document after update error', participant.getSessionMeta());
        await participant.unfixable();
        participant.sendMessage(message);
      }
    }
  }

  sendUpdatesToOthers(message: ClientMessage | ServerMessage, skipSendingToActor = true) {
    this.sendUpdates({ message, senderId: this.id, skipSendingToActor });
  }

  sendUpdates({
    message,
    senderId,
    skipSendingToActor = true
  }: {
    message: ClientMessage | ServerMessage;
    senderId?: string;
    skipSendingToActor?: boolean;
  }) {
    // log.debug(`Broadcasting message "${message.type}" to room`, { pageId: this.getSession().documentId });
    const room = this.getDocumentRoomOrThrow();
    for (const [, participant] of room.participants) {
      if (skipSendingToActor) {
        if (participant.id !== senderId) {
          participant.sendMessage(message);
        }
      } else {
        participant.sendMessage(message);
      }
    }
  }

  onClose() {
    const room = this.getDocumentRoom();
    if (room) {
      room.participants.delete(this.id);
      if (room.participants.size === 0) {
        // Cleanup: add a little delay in case some edits were sent at the same time the user disconnected
        setTimeout(() => {
          if (room.participants.size === 0) {
            docRooms.delete(room.doc.id);
          }
        }, 100);
      } else {
        this.sendParticipantList();
      }
    }
  }

  async saveDiff(diff: ClientDiffMessage) {
    const room = this.getDocumentRoomOrThrow();
    const userId = this.getSession().user.id;
    await prisma.pageDiff.create({
      data: {
        createdAt: new Date(),
        createdBy: userId,
        version: diff.v,
        pageId: room.doc.id,
        data: diff as any
      }
    });
  }

  async saveDocument() {
    const room = this.getDocumentRoomOrThrow();
    const userId = this.getSession().user.id;
    if (room.doc.version === room.lastSavedVersion) {
      return;
    }

    log.debug('Saving document to db', { pageId: room.doc.id, spaceId: room.doc.spaceId });

    const contentText = room.node.textContent;
    // check if content is empty only if it got changed
    const hasContent = contentText.length > 0;
    const galleryImage =
      room.doc.type === 'card' || room.doc.type === 'card_synced' ? extractPreviewImage(room.doc.content) : null;

    const res = await prisma.page.update({
      where: { id: room.doc.id },
      data: {
        content: room.doc.content,
        contentText,
        hasContent,
        galleryImage,
        version: room.doc.version,
        updatedAt: new Date(),
        updatedBy: userId
      },
      select: {
        spaceId: true
      }
    });

    room.lastSavedVersion = room.doc.version;

    if (galleryImage !== room.doc.galleryImage || hasContent !== room.doc.hasContent) {
      room.doc.galleryImage = galleryImage;
      room.doc.hasContent = hasContent;
      relay.broadcast(
        {
          type: 'pages_meta_updated',
          payload: [{ galleryImage, hasContent, spaceId: res.spaceId, id: room.doc.id }]
        },
        res.spaceId
      );
    }
  }
}
