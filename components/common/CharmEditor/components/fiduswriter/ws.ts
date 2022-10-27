import type { Node } from '@bangle.dev/pm';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import type { SocketConnection } from 'hooks/useWebSocketClient';
import log from 'lib/log';

import type { Participant } from './collab';

const gettext = (text: string) => text;

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
}

type ClientMessage = ClientSubscribeMessage | ClientDiffMessage | ClientSelectionMessage | ClientRequestResendMessage | ClientGetDocumentMessage;

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

type PageContentListenEvents = {
  page_message: (message: SocketMessage) => void;
}

type WebSocketConnectorProps = {
  socket: Socket;
  appLoaded: () => boolean;
  anythingToSend: () => boolean;
  sendMessage?: (message: string) => void;
  initialMessage: () => SocketMessage;
  restartMessage: () => SocketMessage; // Too many messages have been lost and we need to restart
  receiveData: (data: SocketMessage) => void;
  resubscribed: () => void; // Cleanup when the client connects a second or subsequent time
}

export interface WebSocketConnector extends WebSocketConnectorProps {}

/* Sets up communicating with server (retrieving document, saving, collaboration, etc.).
 */
export class WebSocketConnector {

  socket: Socket<PageContentListenEvents>;

  // Messages object used to ensure that data is received in right order.
  messages: { server: number, client: number, lastTen: SocketMessage[] } = {
    server: 0,
    client: 0,
    lastTen: []
  };

  /* A list of messages to be sent. Only used when temporarily offline.
          Messages will be sent when returning back online. */
  messagesToSend: (() => SocketMessage)[] = [];

  /* A list of messages from a previous connection */
  oldMessages: (() => SocketMessage)[] = [];

  online = true;

  /* Increases when connection has to be reestablished */
  /* 0 = before first connection. */
  /* 1 = first connection established, etc. */
  connectionCount = 0;

  recentlySent = false;

  // @ts-ignore set up during init()
  listeners: { onOffline: () => any };

  warningNotAllSent = gettext('Warning! Not all your changes have been saved! You could suffer data loss. Attempting to reconnect...'); // Info to show while disconnected WITH unsaved data

  infoDisconnected = gettext('Disconnected. Attempting to reconnect...');// Info to show while disconnected WITHOUT unsaved data

  constructor ({
    socket,
    appLoaded,
    anythingToSend,
    sendMessage,
    initialMessage,
    resubscribed,
    restartMessage,
    receiveData
  }: WebSocketConnectorProps) {
    this.appLoaded = appLoaded;
    this.anythingToSend = anythingToSend;
    this.sendMessage = sendMessage;
    this.initialMessage = initialMessage;
    this.resubscribed = resubscribed;
    this.restartMessage = restartMessage;
    this.receiveData = receiveData;
    this.socket = socket;
    this.createWSConnection();
  }

  init () {

    // Close the socket manually for now when the connection is lost. Sometimes the socket isn't closed on disconnection.
    // const onOffline = () => this.ws?.close();
    // this.listeners.onOffline = onOffline;
    // window.addEventListener('offline', onOffline);
  }

  // these methods are for testing
  // goOffline () {
  //   // Simulate offline mode due to lack of ways of doing this in Chrome/Firefox
  //   // https://bugzilla.mozilla.org/show_bug.cgi?id=1421357
  //   // https://bugs.chromium.org/p/chromium/issues/detail?id=423246
  //   this.online = false;
  //   this.ws?.close();
  // }

  // goOnline () {
  //   // Reconnect from offline mode
  //   this.online = true;
  // }

  close () {
    // this.ws.onclose = () => {};
    // this.ws.close();
    // window.removeEventListener('offline', this.listeners.onOffline);
  }

  createWSConnection () {

    this.messages = {
      server: 0,
      client: 0,
      lastTen: []
    };

    this.open();

    this.socket.on('page_message', data => {
      const expectedServer = this.messages.server + 1;
      if (data.type === 'request_resend') {
        this.resend_messages(data.from);
      }
      else if (data.s < expectedServer) {
        // Receive a message already received at least once. Ignore.

      }
      else if (data.s > expectedServer) {
        // Messages from the server have been lost.
        // Request resend.
        this.socket.emit('page_message', {
          type: 'request_resend',
          from: this.messages.server
        });
      }
      else {
        this.messages.server = expectedServer;
        if (data.c === this.messages.client) {
          this.receive(data);
        }
        else if (data.c < this.messages.client) {
          // We have received all server messages, but the server seems
          // to have missed some of the client's messages. They could
          // have been sent simultaneously.
          // The server wins over the client in this case.
          const clientDifference = this.messages.client - data.c;
          this.messages.client = data.c;
          if (clientDifference > this.messages.lastTen.length) {
            // We cannot fix the situation
            this.send(this.restartMessage);
            return;
          }
          this.messages.lastTen.slice(0 - clientDifference).forEach(_data => {
            this.messages.client += 1;
            _data.c = this.messages.client;
            _data.s = this.messages.server;
            this.socket.emit('page_message', _data);
          });
          this.receive(data);
        }
      }
    });

    this.socket.on('connect', () => {
      log.debug('ws connected!', { anythingToSend: this.anythingToSend() });
      // window.setTimeout(() => {
      //   this.createWSConnection();
      // }, 2000);
      if (!this.appLoaded()) {
        // doc not initiated
        return;
      }

      if (this.sendMessage) {
        if (this.anythingToSend()) {
          this.sendMessage(this.warningNotAllSent);
        }
        else {
          this.sendMessage(this.infoDisconnected);
        }

      }

    });
  }

  open () {

    const message = this.initialMessage();
    this.connectionCount += 1;
    this.oldMessages = this.messagesToSend;
    this.messagesToSend = [];

    this.send(() => message);
  }

  subscribed () {
    if (this.connectionCount > 1) {
      this.resubscribed();
      while (this.oldMessages.length > 0) {
        const message = this.oldMessages.shift();
        if (message) {
          this.send(message);
        }
      }
    }
  }

  /** Sends data to server or keeps it in a list if currently offline. */
  send (getData: () => SocketMessage, timer = 80) {
    // logic from original source: reconnect if not connected anymore
    // if (this.connected && socket.readyState !== socket.OPEN) {
    //   // @ts-ignore
    //   ws.onclose();
    // }
    if (this.socket.connected && !this.recentlySent) {
      const data = getData();
      if (!data) {
        // message is empty
        return;
      }
      this.messages.client += 1;
      data.c = this.messages.client;
      data.s = this.messages.server;
      this.messages.lastTen.push(data);
      this.messages.lastTen = this.messages.lastTen.slice(-10);
      this.socket.emit('page_message', data);
      this.setRecentlySentTimer(timer);
    }
    else {
      this.messagesToSend.push(getData);
    }
  }

  setRecentlySentTimer (timer: number) {
    this.recentlySent = true;
    window.setTimeout(() => {
      this.recentlySent = false;
      const oldMessages = this.messagesToSend;
      this.messagesToSend = [];
      while (oldMessages.length > 0) {
        const getData = oldMessages.shift();
        if (getData) {
          this.send(getData, Math.min(timer * 1.2, 10000));
        }
      }
    }, timer);
  }

  resend_messages (from: number) {
    const toSend = this.messages.client - from;
    this.messages.client = from;
    if (toSend > this.messages.lastTen.length) {
      // Too many messages requested. Abort.
      this.send(this.restartMessage);
      return;
    }
    this.messages.lastTen.slice(0 - toSend).forEach(data => {
      this.messages.client += 1;
      data.c = this.messages.client;
      data.s = this.messages.server;
      this.socket?.emit('page_message', data);
    });
  }

  receive (data: SocketMessage) {
    switch (data.type) {
      // case 'welcome':
      //   this.open();
      //   break;
      case 'subscribed':
        this.subscribed();
        break;
      // case 'access_denied':
      //   this.failedAuth();
      //   break;
      default:
        this.receiveData(data);
        break;
    }
  }

}
