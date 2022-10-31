import type { Node } from '@bangle.dev/pm';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { prisma } from 'db';
import log from 'lib/log';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import type { SealedUserId } from 'lib/websockets/interfaces';

const authSecret = process.env.AUTH_SECRET as string;
const socketEvent = 'message';

export type Participant = {
  id: string;
  name: string;
  session_id: string | undefined;
  sessionIds: string[];
};

type BaseSocketMessage<T> = T & {
  c: number; // client
  s: number; // server
  v: number; // version
};

export type ClientRequestResendMessage = BaseSocketMessage<{
  type: 'request_resend';
  from: number;
}>;

type ClientGetDocumentMessage = {
  type: 'get_document';
};

export type ClientSelectionMessage = BaseSocketMessage<{
  type: 'selection_change';
  id: string;
  session_id: string;
  anchor: number;
  head: number;
}>;

export type ClientDiffMessage = BaseSocketMessage<{
  type: 'diff';
  rid: number;
  cid?: number; // client id
  ds?: any[]; // steps to send
  jd?: any; // used by python backend in fiduswriter - maybe we dont need it?
  ti?: string; // new title
  doc?: Node;
}>;

export type ClientSubscribeMessage = {
  type: 'subscribe';
  roomId: string;
  authToken: string;
  connection?: number;
}

export type ClientUnsubscribeMessage = {
  type: 'unsubscribe';
  roomId: string;
}

export type ClientMessage = ClientSubscribeMessage
  | ClientDiffMessage
  | ClientSelectionMessage
  | ClientRequestResendMessage
  | ClientGetDocumentMessage
  | ClientUnsubscribeMessage;

type ServerConnectionsMessage = {
  type: 'connections';
  participant_list: Participant[];
};

export type ServerDocDataMessage = {
  type: 'doc_data';
  doc: { content: Node, v: number };
  doc_info: { id: string, session_id: string, updated: any }; // TODO: do we need this?
  time: number;
};

export type ServerDiffMessage = {
  type: 'confirm_diff' | 'reject_diff';
  rid: number;
};

export type ServerErrorMessage = {
  type: 'error';
  message: string;
}

type ServerMessage = ServerConnectionsMessage
  | ServerDocDataMessage
  | ServerDiffMessage
  | ServerErrorMessage
  | { type: 'confirm_version' | 'subscribed' | 'patch_error' | 'welcome' };

export type SocketMessage = ClientMessage | ServerMessage;

type DocumentState = {
  participants: Record<string, Participant>;
  doc: {
    id: string;
    version: number;
    content: any;
  };
}

const docState = new Map<string, DocumentState>();

class CharmEditorEvents {
  messages: { server: number, client: number, lastTen: ServerMessage[] } = {
    server: 0,
    client: 0,
    lastTen: []
  };

  constructor (private socket: Socket) {

    socket.on(socketEvent, async message => {
      try {
        await this.handleMessage(message);
      }
      catch (error) {
        log.error('Error handling message', error);
      }
    });
  }

  open () {
    // console.log('send welcome!');
    this.sendMessage({ type: 'welcome' });
  }

  async handleMessage (message: ClientMessage) {

    const socket = this.socket;

    log.debug('Socket server received message:', message);

    switch (message.type) {

      case 'subscribe': {
        try {
          const r = await unsealData<SealedUserId>(message.authToken, {
            password: authSecret
          });
          const userId = r.userId;
          const pageId = message.roomId;

          if (typeof userId === 'string') {
            const permissions = await computeUserPagePermissions({
              pageId,
              userId
            });

            if (permissions.edit_content !== true) {
              this.sendMessage({ type: 'error', message: 'You do not have permission to view this page' });
              return;
            }

            socket.join([pageId]);
            socket.pageId = pageId;
            this.sendMessage({ type: 'subscribed' });
            if (typeof message.connection !== 'number' || message.connection < 1) {
              await this.sendDocument(socket, message.roomId);
              log.debug('Sent document to new subscriber');
            }
          }
        }
        catch (err) {
          socket.emit('error', 'Unable to register user');
        }
        break;
      }

      case 'unsubscribe':
        socket.leave(message.roomId);
        break;

      default:
        log.debug('Unhandled socket message type', message);
    }
  }

  async handleDiff (socket: Socket, message: ClientDiffMessage) {
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
        updated: page.updatedAt
      },
      time: Date.now()
    };
    this.sendMessage(message);
  }

  sendMessage (message: ServerMessage) {
    this.messages.server += 1;
    message.c = this.messages.client;
    message.s = this.messages.server;
    this.messages.lastTen.push(message);
    this.messages.lastTen = this.messages.lastTen.slice(-10);
    try {
      this.socket.emit(socketEvent, message);
    }
    catch (err) {
      log.error('Error sending message', err);
    }
  }

}

export async function registerCharmEditorEvents (socket: Socket) {
  const handler = new CharmEditorEvents(socket);
  handler.open();
}
