import type { Socket } from 'socket.io';
import { validate } from 'uuid';

import { prisma } from 'db';
import log from 'lib/log';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

import type { AuthenticatedSocket } from '../authentication';

import type { Participant, WrappedSocketMessage, ClientMessage, ServerDocDataMessage, ClientDiffMessage, ServerMessage } from './interfaces';

type SocketSessionData = AuthenticatedSocket & {
  documentId?: string;
  isOwner?: boolean;
  permissions: Partial<IPagePermissionFlags>;
}

type DocumentState = {
  participants: Record<string, Participant>;
  doc: {
    id: string;
    version: number;
    content: any;
  };
}

const docState = new Map<string, DocumentState>();

export class DocumentEventHandler {

  socketEvent = 'message';

  messages: { server: number, client: number, lastTen: ServerMessage[] } = {
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

  constructor (private socket: Socket) {

    const user = socket.data.user;

    this.setSession({
      user: { id: user.id },
      permissions: {}
    });

    this.listen();
    this.open();
  }

  private listen () {
    this.socket.on(this.socketEvent, async message => {
      try {
        await this.onMessage(message);
      }
      catch (error) {
        log.error('Error handling web socket document message', error);
      }
    });
  }

  open () {
    this.sendMessage({ type: 'welcome' });
  }

  async onMessage (message: WrappedSocketMessage<ClientMessage>) {

    log.debug('Socket server received message:', message);

    if (message.type === 'request_resend') {
      await this.resendMessages(message.from);
      return;
    }

    if (!('c' in message) || !('s' in message)) {
      this.sendError('Invalid message');
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
    await this.handleMessage(message);
  }

  async handleMessage (message: WrappedSocketMessage<ClientMessage>) {

    const socket = this.socket;

    // handle subscription to document
    if (message.type === 'subscribe') {
      try {
        const userId = this.getSession().user.id;
        const pageId = message.roomId;
        log.debug('[charm ws] subscribe event', { userId, pageId });

        const isValidPageId = validate(pageId);
        if (!isValidPageId) {
          throw new Error(`Invalid page id: ${pageId}`);
        }
        const permissions = await computeUserPagePermissions({
          pageId,
          userId
        });

        this.setSession({ permissions });

        if (permissions.edit_content !== true) {
          this.sendError('You do not have permission to view this page');
          return;
        }

        socket.join([pageId]);
        // socket.pageId = pageId;
        this.sendMessage({ type: 'subscribed' });
        if (typeof message.connection !== 'number' || message.connection < 1) {
          await this.sendDocument(socket, message.roomId);
          log.debug('Sent document to new subscriber');
        }
      }
      catch (error) {
        log.error('Error registering user to page events', { error });
        this.sendError('Unable to register user');
      }
    }

    // handle event from closed document
    const session = socket.data as SocketSessionData;

    if (!session.documentId) {
      return;
    }

    if (!docState.has(session.documentId ?? '')) {
      log.debug('Ignore message from closed document', { pageId: session.documentId });
      return;
    }

    switch (message.type) {

      case 'get_document':
        // socket.leave(message.roomId);
        break;

      default:
        log.debug('Unhandled socket message type', message);
    }
  }

  async handleDiff (socket: Socket, message: WrappedSocketMessage<ClientDiffMessage>) {
    const pv = message.v;
    const dv = docState.get(socket.id)?.doc.version;
  }

  async sendDocument (socket: Socket, pageId: string) {
    const page = await prisma.page.findUniqueOrThrow({
      where: { id: pageId },
      select: { content: true, updatedAt: true, id: true, version: true }
    });
    const message: ServerDocDataMessage = {
      type: 'doc_data',
      doc: {
        content: page.content as any,
        v: page.version
      },
      doc_info: {
        id: page.id,
        session_id: socket.id,
        updated: page.updatedAt,
        version: page.version
      },
      time: Date.now()
    };
    this.sendMessage(message);
  }

  resendMessages (from: number) {
    log.error('TODO: Implement resend messages', from);
  }

  rejectMessage (message: WrappedSocketMessage<ClientMessage>) {
    if (message.type === 'diff') {
      this.sendMessage({ type: 'reject_diff', rid: message.rid });
    }
  }

  sendMessage (message: ServerMessage) {
    this.messages.server += 1;
    const wrappedMessage: WrappedSocketMessage<ServerMessage> = {
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

}
