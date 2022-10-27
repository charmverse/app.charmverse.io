import type { Node } from '@bangle.dev/pm';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import log from 'lib/log';
import type { SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

const authSecret = process.env.AUTH_SECRET as string;
const socketEvent = 'page_message';

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

type ServerConnectionsMessage = BaseSocketMessage<{
  type: 'connections';
  participant_list: Participant[];
}>;

export type ServerDocDataMessage = BaseSocketMessage<{
  type: 'doc_data';
  doc: { content: Node, v: number };
  doc_info: any;
  time: number;
}>;

export type ServerDiffMessage = BaseSocketMessage<{
  type: 'confirm_diff' | 'reject_diff';
  rid: number;
}>;

type ServerMessageType = 'confirm_version' | 'subscribed' | 'welcome' | 'patch_error';
type ServerMessage = ServerConnectionsMessage | ServerDocDataMessage | ServerDiffMessage | BaseSocketMessage<{
  type: ServerMessageType;
}>;

export type SocketMessage = ClientMessage | ServerMessage;

export async function registerPageEvents (socket: Socket) {

  socket.emit(socketEvent, { type: 'welcome' });

  socket.on(socketEvent, async (message: ClientMessage) => {

    log.debug('page message message', message);

    try {
      switch (message.type) {

        case 'subscribe': {
          const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.authToken, {
            password: authSecret
          });

          if (typeof decryptedUserId === 'string') {
            relay.registerPageSubscriber({
              userId: decryptedUserId,
              socket,
              roomId: message.roomId
            });
            if (typeof message.connection !== 'number' || message.connection < 1) {
              sendDocument(socket, message.roomId);
            }
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
    catch (err) {
      socket.emit('error', 'Unable to register user');
    }
  });
}

function sendDocument (socket: Socket, pageId: string) {
  const message: ServerDocDataMessage = {
    type: 'doc_data'

  };
  socket.emit(socketEvent, message);
}
