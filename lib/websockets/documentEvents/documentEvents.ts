import type { Node } from '@bangle.dev/pm';
import type { Socket } from 'socket.io';
import { validate } from 'uuid';

import { prisma } from 'db';
import log from 'lib/log';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';

import type { AuthenticatedSocket } from '../authentication';

import type { Participant, WrappedSocketMessage, ClientMessage, ServerDocDataMessage, ClientCheckVersionMessage, ClientDiffMessage, ClientSelectionMessage, ServerMessage } from './interfaces';

type SocketSessionData = AuthenticatedSocket & {
  documentId?: string;
  isOwner?: boolean;
  permissions: Partial<IPagePermissionFlags>;
}

type DocumentRoom = {
  // eslint-disable-next-line no-use-before-define
  participants: Record<string, DocumentEventHandler>;
  doc: {
    id: string;
    version: number;
    content: any;
    diffs: ClientDiffMessage[];
  };
  lastSavedVersion?: number;
  node: Node;
}

const docRooms = new Map<string | undefined, DocumentRoom>();

export class DocumentEventHandler {

  id: string;

  docSaveInterval = 1; // how often to save document to database

  historyLength = 1000; // Only keep the last 1000 diffs

  socketEvent = 'message';

  messages: { server: number, client: number, lastTen: (ClientMessage | ServerMessage)[] } = {
    server: 0,
    client: 0,
    lastTen: []
  };

  // store session data on the socket from socket-io
  getSession () {
    return this.socket.data as SocketSessionData;
  }

  setSession (data: Partial<SocketSessionData>) {
    Object.assign(this.socket.data, data);
  }

  getDocumentRoom () {
    const docId = this.getSession().documentId;
    const room = docRooms.get(docId);
    if (!room) {
      throw new Error(`Could not find room by id: ${docId}`);
    }
    return room;
  }

  constructor (private socket: Socket) {

    this.id = socket.id;

    const user = socket.data.user;

    this.setSession({
      user: { id: user.id, name: user.username },
      permissions: {}
    });

    this.socket.on(this.socketEvent, async message => {
      try {
        await this.onMessage(message);
      }
      catch (error) {
        log.error('Error handling web socket document message', error);
      }
    });

    this.socket.on('disconnect', () => {
      this.onClose();
    });

    this.sendMessage({ type: 'welcome' });
  }

  async onMessage (message: WrappedSocketMessage<ClientMessage>) {

    log.debug('Socket server received message:', message);

    if (message.type === 'request_resend') {
      await this.resendMessages(message.from);
      return;
    }

    if (!('c' in message) || !('s' in message)) {
      this.sendError('Received invalid message');
      return;
    }
    else if (message.c < this.messages.client + 1) {
      // Receive a message already received at least once. Ignore.
      return;
    }
    else if (message.c > this.messages.client + 1) {
      log.debug('Request resent of lost messages from client');
      this.sendMessage({ type: 'request_resend', from: this.messages.client });
      return;
    }
    else if (message.s < this.messages.server) {
      /* Message was sent either simultaneously with message from server
         or a message from the server previously sent never arrived.
         Resend the messages the client missed. */
      log.debug('Resend messages to client');
      this.messages.client += 1;
      await this.resendMessages(message.s);
      await this.rejectMessage(message);
      return;
    }

    // message order is correct. continue processing message
    this.messages.client += 1;
    try {
      await this.handleMessage(message);
    }
    catch (error) {
      log.error('Error handling socket message', { error, userId: this.getSession().user.id });
    }
  }

  async handleMessage (message: WrappedSocketMessage<ClientMessage>) {

    const session = this.getSession();

    // handle subscription to document
    if (message.type === 'subscribe') {
      await this.subscribeToDoc({ pageId: message.roomId, connectionCount: message.connection });
      return;
    }

    if (!session.documentId) {
      log.warn('Ignore message because session is missing document', { userId: session.user.id });
      return;
    }

    if (!docRooms.has(session.documentId)) {
      log.debug('Ignore message from closed document', { pageId: session.documentId });
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
        if (session.permissions.edit_content) {
          await this.handleDiff(message);
        }
        break;

      default:
        log.debug('Unhandled socket message type', message);
    }
  }

  async subscribeToDoc ({ pageId, connectionCount = 0 }: { pageId: string, connectionCount?: number }) {

    try {
      const userId = this.getSession().user.id;
      log.debug('[charm ws] subscribe event', { pageId, userId });

      const isValidPageId = validate(pageId);
      if (!isValidPageId) {
        throw new Error(`Invalid page id: ${pageId}`);
      }
      const permissions = await computeUserPagePermissions({
        pageId,
        userId
      });

      if (permissions.edit_content !== true) {
        this.sendError('You do not have permission to view this page');
        return;
      }

      this.setSession({ documentId: pageId, permissions });

      const docRoom = docRooms.get(pageId);
      if (docRoom && Object.keys(docRoom.participants).length > 0) {
        log.debug('Join existing document room', { pageId, userId });
        docRoom.participants[this.id] = this;
      }
      else {
        log.debug('Opening new document room', { pageId, userId });
        const page = await prisma.page.findUniqueOrThrow({
          where: { id: pageId }
        });
        const content = page.content || { type: 'doc', content: [] };
        const room: DocumentRoom = {
          doc: {
            id: page.id,
            content,
            version: page.version,
            // TODO: populate with diffs from the db
            diffs: []
          },
          node: getNodeFromJson(content),
          participants: { [this.id]: this }
        };
        docRooms.set(pageId, room);
      }

      this.sendMessage({ type: 'subscribed' });
      if (connectionCount < 1) {
        await this.sendDocument();
        log.debug('Sent document to new subscriber');
      }
      this.handleParticipantUpdate();
    }
    catch (error) {
      log.error('Error subscribing user to page', { error });
      this.sendError('There was an error loading the page! Please try again later.');
    }
  }

  confirmDiff (rid: number) {
    this.sendMessage({ type: 'confirm_diff', rid });
  }

  handleParticipantUpdate () {
    this.sendParticipantList();
  }

  sendParticipantList () {
    const room = this.getDocumentRoom();
    const participantList: Participant[] = [];
    for (const participant of Object.values(room.participants)) {
      const session = participant.getSession();
      participantList.push({
        id: session.user.id,
        name: session.user.name,
        sessionIds: [],
        session_id: participant.id
      });
    }
    this.sendUpdates({ type: 'connections', participant_list: participantList });
  }

  handleSelectionChange (message: ClientSelectionMessage) {
    const room = this.getDocumentRoom();
    if (message.v === room.doc.version) {
      this.sendUpdates(message);
    }
  }

  async handleDiff (message: WrappedSocketMessage<ClientDiffMessage>) {
    const room = this.getDocumentRoom();
    const clientVersion = message.v;
    const dv = room.doc.version;
    log.debug('Handling diff');
    if (clientVersion === dv) {
      if (message.ds) {
        const updatedNode = applyStepsToNode(message.ds, room.node);
        if (updatedNode) {
          room.node = updatedNode;
        }
        else {
          this.unfixable();
          const patchError = { type: 'patch_error' } as const;
          this.sendMessage(patchError);
          // Reset collaboration to avoid any data loss issues.
          this.resetCollaboration(patchError);
          return;
        }
        room.doc.content = updatedNode.toJSON();
      }
      room.doc.diffs.push(message);
      room.doc.diffs = room.doc.diffs.slice(this.historyLength);
      room.doc.version += 1;
      if (room.doc.version % this.docSaveInterval === 0) {
        await this.saveDocument();
      }
      this.confirmDiff(message.rid);
      this.sendUpdates(message);
    }
    else if (clientVersion < dv) {
      if (clientVersion + room.doc.diffs.length >= dv) {
        const numberDiffs = clientVersion - dv;
        log.debug('Client is behind. Resend document diffs', { numberDiffs });
        const messages = room.doc.diffs.slice(numberDiffs);
        for (const m of messages) {
          const newMessage = { ...m, server_fix: true };
          await this.sendMessage(newMessage);
        }
      }
      else {
        log.debug('Client is too far behind. Resend document');
        await this.unfixable();
      }
    }
    else {
      log.debug('Ignore message from user with higher document version than server');
    }
  }

  async checkVersion (message: ClientCheckVersionMessage) {
    const session = this.getSession();
    const room = this.getDocumentRoom();
    const pv = message.v;
    const dv = room?.doc.version;
    log.debug('Check version of document', { client: pv, server: dv, userId: session.user.id });
    if (pv === dv) {
      this.sendMessage({ type: 'confirm_version', v: pv });
    }
    else if (pv + room.doc.diffs.length >= dv) {
      const numberDiffs = pv - dv;
      log.debug('Resending document diffs', { numberDiffs, userId: session.user.id });
      const messages = room?.doc.diffs.slice(numberDiffs);
      this.sendDocument(messages);
    }
    else {
      log.debug('User is on a very old version of the document');
      this.unfixable();
    }
  }

  unfixable () {
    return this.sendDocument();
  }

  resendMessages (from: number) {
    const toSend = this.messages.server - from;
    log.debug('Resending messages to user');
    this.messages.server -= toSend;
    if (toSend > this.messages.lastTen.length) {
      log.debug('Too many messages to resend. Send full document');
      this.unfixable();
    }
    else {
      for (const message of this.messages.lastTen.slice(-toSend)) {
        this.sendMessage(message);
      }
    }
  }

  async sendDocument (messages?: ClientDiffMessage[]) {
    const session = this.getSession();

    const page = await prisma.page.findUniqueOrThrow({
      where: { id: session.documentId },
      select: { content: true, updatedAt: true, id: true, version: true }
    });
    const content = page.content as any || { type: 'doc', content: [] };
    const message: ServerDocDataMessage = {
      type: 'doc_data',
      doc: {
        content,
        v: page.version
      },
      doc_info: {
        id: page.id,
        session_id: this.id,
        updated: page.updatedAt,
        version: page.version
      },
      time: Date.now()
    };
    if (messages) {
      message.m = messages;
    }
    this.sendMessage(message);
  }

  rejectMessage (message: WrappedSocketMessage<ClientMessage>) {
    if (message.type === 'diff') {
      this.sendMessage({ type: 'reject_diff', rid: message.rid });
    }
  }

  sendMessage (message: ClientMessage | ServerMessage) {
    this.messages.server += 1;
    const wrappedMessage: WrappedSocketMessage<ClientMessage | ServerMessage> = {
      ...message,
      c: this.messages.client,
      s: this.messages.server
    };
    this.messages.lastTen.push(message);
    this.messages.lastTen = this.messages.lastTen.slice(-10);
    try {
      this.socket.emit(this.socketEvent, wrappedMessage);
    }
    catch (err) {
      log.error('Error sending message', err);
    }
  }

  sendError (message: string) {
    this.sendMessage({ type: 'error', message });
  }

  async resetCollaboration (message: ServerMessage) {
    log.debug('Resetting collaboration');
    const room = this.getDocumentRoom();
    for (const participant of Object.values(room.participants)) {
      if (participant.id !== this.id) {
        await participant.unfixable();
        participant.sendMessage(message);
      }
    }
  }

  sendUpdates (message: ClientMessage | ServerMessage) {
    const pageId = this.getSession().documentId;
    log.debug('Sending message to waiters', { pageId });
    const room = this.getDocumentRoom();
    for (const participant of Object.values(room.participants)) {
      if (participant.id !== this.id) {
        participant.sendMessage(message);
      }
    }
  }

  onClose () {
    log.debug('Closing collaboration session');
    const room = this.getDocumentRoom();
    delete room.participants[this.id];
    if (room) {
      delete room.participants[this.id];
      if (Object.keys(room.participants).length === 0) {
        docRooms.delete(room.doc.id);
      }
      else {
        this.sendParticipantList();
      }
    }
  }

  async saveDocument () {
    const room = this.getDocumentRoom();
    const userId = this.getSession().user.id;
    if (room.doc.version === room.lastSavedVersion) {
      return;
    }

    log.debug('Saving document to db', { version: room.doc.version, pageId: room.doc.id });

    await prisma.page.update({
      where: { id: room.doc.id },
      data: {
        content: room.doc.content,
        contentText: room.node.textContent,
        version: room.doc.version,
        updatedAt: new Date(),
        updatedBy: userId
      }
    });

    room.lastSavedVersion = room.doc.version;
  }

}
