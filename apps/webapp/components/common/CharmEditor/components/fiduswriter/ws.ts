/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { log } from '@charmverse/core/log';
import { websocketsHost } from '@packages/config/constants';
import type { ClientDiffMessage } from '@packages/pages/generateFirstDiff';
import type {
  ClientMessage,
  ClientRestartMessage,
  ClientSubscribeMessage,
  RequestResendMessage,
  ServerMessage,
  WrappedSocketMessage
} from '@packages/websockets/documentEvents/interfaces';
import type { Plugin } from 'prosemirror-state';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import type { FidusEditor } from './fiduseditor';

const gettext = (text: string) => text;

const namespace = '/ceditor';

const socketHost = `${websocketsHost || ''}${namespace}`;
const socketEvent = 'message';

type WrappedServerMessage = WrappedSocketMessage<ServerMessage>;
type WrappedMessage = WrappedSocketMessage<ClientMessage | ServerMessage>;

export type ConnectionEvent = { type: 'subscribed' } | { type: 'error'; error: Error };

type WebSocketConnectorProps = {
  authToken: string;
  anythingToSend: () => boolean;
  editor: FidusEditor;
  onConnectionEvent: (event: ConnectionEvent) => void;
  onError: (error: Error) => void;
  sendMessage?: (message: string) => void;
  initialMessage: () => ClientSubscribeMessage;
  restartMessage: () => ClientRestartMessage; // Too many messages have been lost and we need to restart
  receiveData: (data: WrappedServerMessage) => void;
  resubscribed: () => void; // Cleanup when the client connects a second or subsequent time
  historyPlugin?: Plugin<any> | null;
};

type ServerToClientEvents = { message: (message: WrappedMessage | RequestResendMessage) => void };
type ClientToServerEvents = {
  [event: string]: any;
};
export interface WebSocketConnector extends WebSocketConnectorProps {}

/* Sets up communicating with server (retrieving document, saving, collaboration, etc.).
 */
export class WebSocketConnector {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  // Messages dataect used to ensure that data is received in right order.
  messages: { server: number; client: number; lastTen: WrappedMessage[] } = {
    server: 0,
    client: 0,
    lastTen: []
  };

  /* A list of messages to be sent. Only used when temporarily offline.
          Messages will be sent when returning back online. */
  messagesToSend: (() => ClientMessage | false)[] = [];

  /* A list of messages from a previous connection */
  oldMessages: (() => ClientMessage | false)[] = [];

  // online = true;

  /* Increases when connection has to be reestablished */
  /* 0 = before first connection. */
  /* 1 = first connection established, etc. */
  connectionCount = 0;

  recentlySent = false;

  // listeners: { onOffline?: () => any } = {};

  warningNotAllSent = gettext(
    'Warning! Not all your changes have been saved! You could suffer data loss. Attempting to reconnect...'
  ); // Info to show while disconnected WITH unsaved data

  infoDisconnected = gettext('Disconnected. Attempting to reconnect...'); // Info to show while disconnected WITHOUT unsaved data

  constructor({
    anythingToSend,
    authToken,
    editor,
    sendMessage,
    initialMessage,
    resubscribed,
    restartMessage,
    receiveData,
    onConnectionEvent,
    historyPlugin
  }: Omit<WebSocketConnectorProps, 'onError'>) {
    this.anythingToSend = anythingToSend;
    this.editor = editor;
    this.sendMessage = sendMessage;
    this.initialMessage = initialMessage;
    this.resubscribed = resubscribed;
    this.restartMessage = restartMessage;
    this.receiveData = receiveData;
    this.onConnectionEvent = onConnectionEvent;
    this.historyPlugin = historyPlugin;
    this.onError = (error: Error) => {
      onConnectionEvent({ type: 'error', error });
    };

    // socket.io client options: https://socket.io/docs/v4/client-options/
    this.socket = io(socketHost, {
      withCredentials: true,
      auth: {
        authToken
      },
      transports: ['websocket'] // skip long-polling
    });
    this.createWSConnection();
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

  close() {
    this.socket.disconnect();
    log.debug('Page socket closed');
    // window.removeEventListener('offline', this.listeners.onOffline);
  }

  createWSConnection() {
    this.messages = {
      server: 0,
      client: 0,
      lastTen: []
    };

    // this.open()//;

    this.socket.on('message', (_data) => {
      const data = _data as WrappedServerMessage;

      // console.log('ws - on socket events', data);
      const expectedServer = this.messages.server + 1;
      // console.log('[charm ws] socket message', data, expectedServer);
      if (data.type === 'request_resend') {
        this.resendMessages(data.from);
      } else if (data.s < expectedServer) {
        log.debug(`[ws${namespace}] ignore old message`, { expectedServer, data });
        // Receive a message already received at least once. Ignore.
      } else if (data.s > expectedServer) {
        log.warn(`[ws${namespace}] request server to resend messages`, { expectedServer, data });
        // Messages from the server have been lost.
        // Request resend.
        this.waitForWS().then(() =>
          this.socket.emit(socketEvent, {
            type: 'request_resend',
            from: this.messages.server
          })
        );
      } else {
        this.messages.server = expectedServer;
        // console.log('handle server message', expectedServer, data, this.messages.client);
        if (data.c === this.messages.client) {
          // console.log('[charm] receive messages');
          this.receive(data);
        } else if (data.c < this.messages.client) {
          log.warn(`[ws${namespace}] received all messages but server is missing client messages`, {
            data,
            clientMessages: this.messages.client
          });
          // We have received all server messages, but the server seems
          // to have missed some of the client's messages. They could
          // have been sent simultaneously.
          // The server wins over the client in this case.
          this.waitForWS().then(() => {
            const clientDifference = this.messages.client - data.c;
            this.messages.client = data.c;
            if (clientDifference > this.messages.lastTen.length) {
              log.debug(`[ws${namespace}] reset the document because we are too far ahead of the server`, {
                messagesAvailableToResend: this.messages.lastTen.length,
                clientDifference
              });
              // We cannot fix the situation
              this.send(this.restartMessage);
              return;
            }
            this.messages.lastTen.slice(0 - clientDifference).forEach((__data) => {
              this.messages.client += 1;
              const wrappedMessage = {
                ...__data,
                c: this.messages.client,
                s: this.messages.server
              };
              this.socket.emit(socketEvent, wrappedMessage);
            });
            this.receive(data);
          });
        }
      }
    });

    this.socket.on('disconnect', (reason, data) => {
      const payloadTooBig = (data as any)?.context?.code === 1009;
      if (payloadTooBig) {
        this.onError(new Error('Document content size too large, please try pasting smaller portions'));
        this.editor.waitingForDocument = true;
        this.send(this.restartMessage);
      }
    });

    this.socket.on('connect', () => {
      // // console.log('connected');
      log.info(`[ws${namespace}] Client connected`, { connectionCount: this.connectionCount });
      this.open();
      // try {
      //   const sendable = this.anythingToSend();
      // }
      // catch (e) {
      // }
      // // console.log('[charm] socket connected!', { anythingToSend: this.anythingToSend() });
      // window.setTimeout(() => {
      //   this.createWSConnection();
      // }, 2000);
      // if (!this.appLoaded()) {
      //   // doc not initiated
      //   return;
      // }

      // if (this.sendMessage) {
      //   if (this.anythingToSend()) {
      //     this.sendMessage(this.warningNotAllSent);
      //   }
      //   else {
      //     this.sendMessage(this.infoDisconnected);
      //   }

      // }
    });

    this.socket.on('connect_error', (error) => {
      const errorType = (error as any).type as string;
      if (errorType === 'TransportError') {
        // ..... TODO HERE
        // server is probably restarting
        log.warn(`[ws${namespace}] Connection error`, {
          error,
          errorType,
          client: this.messages.client,
          server: this.messages.server,
          toSend: this.messagesToSend.length
        });
        // if no messages, then we never made a connection
        if (this.messages.client === 0 && this.messages.server === 0) {
          this.onError(new Error('Error connecting to document server'));
        }
      } else if ((error as any).code === 'parser error') {
        // ignore error - seems to happen on deploy
      } else {
        log.error(`[ws${namespace}] Connection error`, {
          error,
          errorType,
          client: this.messages.client,
          server: this.messages.server,
          toSend: this.messagesToSend.length
        });
        this.onError(error);
      }
    });
  }

  waitForWS() {
    return new Promise<void>((resolve) => {
      if (this.socket.connected) {
        resolve();
      } else {
        new Promise<void>((resolveTimer) => {
          setTimeout(resolveTimer, 100);
        })
          .then(() => this.waitForWS())
          .then(() => resolve());
      }
    });
  }

  open() {
    const message = this.initialMessage();
    this.oldMessages = this.messagesToSend;
    this.messagesToSend = [];
    this.messages = {
      server: 0,
      client: 0,
      lastTen: []
    };

    this.send(() => message);
  }

  subscribed() {
    this.connectionCount += 1;
    if (this.connectionCount > 1) {
      log.debug('Resubscribed to document', {
        client: this.messages.client,
        server: this.messages.server,
        messagesToSend: this.oldMessages.length
      });
      this.resubscribed();
      while (this.oldMessages.length > 0) {
        const message = this.oldMessages.shift();
        if (message) {
          this.send(message);
        }
      }
    }
    this.onConnectionEvent({ type: 'subscribed' });
  }

  /** Sends data to server or keeps it in a list if currently offline. */
  send(getData: () => ClientMessage | false, timer = 80) {
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

      const wrappedMessage: WrappedMessage = {
        ...data,
        c: this.messages.client,
        s: this.messages.server
      };

      if (wrappedMessage.type === 'diff') {
        const historyPluginState = this.historyPlugin?.getState(this.editor.view.state);
        wrappedMessage.undo = historyPluginState?.prevRanges === null ?? false;
      }

      this.messages.lastTen.push(wrappedMessage);
      this.messages.lastTen = this.messages.lastTen.slice(-10);
      this.waitForWS().then(() => {
        log.debug(`[ws${namespace}] Send message`, { data: wrappedMessage });
        this.socket.emit(socketEvent, wrappedMessage);
        this.setRecentlySentTimer(timer);
      });
    } else {
      this.messagesToSend.push(getData);
    }
  }

  extractPagePath(data: ClientDiffMessage) {
    const ds = data.ds[0];
    const content0 = ds.slice?.content?.[0];
    const content1 = ds.slice?.content?.[1];

    if (!ds || !content0 || !content1) {
      return null;
    }

    // Check if the step type is replace
    const isReplace = ds.stepType === 'replace' && ds.from === ds.to;

    if (!isReplace) {
      return null;
    }

    const isImage = content0.type === 'image';
    const isParagraph = content1.type === 'paragraph';

    if (!isImage || !isParagraph) {
      return null;
    }

    // Check if the paragraph's first content is a text with the first mark of that text being a link and get the href attribute of that link
    let href = null;
    const content10 = content1.content?.[0];
    if (content10.type === 'text' && content10.marks.length > 0 && content10.marks[0].type === 'link') {
      href = content10.marks[0].attrs.href;
    }

    if (href.startsWith(window.location.origin)) {
      href = href.split('/').at(-1);
    }

    return href;
  }

  setRecentlySentTimer(timer: number) {
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

  resendMessages(from: number) {
    return this.waitForWS().then(() => {
      const toSend = this.messages.client - from;
      this.messages.client = from;
      if (toSend > this.messages.lastTen.length) {
        // Too many messages requested. Abort.
        this.send(this.restartMessage);
        return;
      }
      this.messages.lastTen.slice(0 - toSend).forEach((data) => {
        this.messages.client += 1;
        data.c = this.messages.client;
        data.s = this.messages.server;
        this.socket?.emit(socketEvent, data);
      });
    });
  }

  receive(data: WrappedServerMessage) {
    log.debug(`[ws${namespace}] Received event`, { serverMessages: this.messages.server, data });
    switch (data.type) {
      case 'welcome':
        // this.open();
        break;
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
