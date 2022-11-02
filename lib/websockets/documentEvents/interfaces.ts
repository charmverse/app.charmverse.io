import type { Node } from '@bangle.dev/pm';

export type Participant = {
  id: string;
  name: string;
  session_id: string | undefined;
  sessionIds: string[];
};

export type WrappedSocketMessage<T> = T & {
  c: number; // client
  s: number; // server
};

export type RequestResendMessage = {
  type: 'request_resend';
  from: number;
};

export type ConfirmVersionMessage = {
  type: 'confirm_version';
  v: number;
}

// messages from both client and server
type StandardMessage = ConfirmVersionMessage | RequestResendMessage;

export type ClientRestartMessage = {
  type: 'get_document';
};

type ClientCheckVersionMessage = {
  type: 'check_version';
  v: number;
};

export type ClientSelectionMessage = {
  type: 'selection_change';
  id: string;
  session_id: string;
  anchor: number;
  head: number;
  v: number;
};

export type ClientDiffMessage = {
  type: 'diff';
  rid: number;
  cid?: number; // client id
  ds?: any[]; // steps to send
  jd?: any; // used by python backend in fiduswriter - maybe we dont need it?
  ti?: string; // new title
  doc?: Node;
  v: number;
};

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

export type ClientMessage = StandardMessage
  | ClientSubscribeMessage
  | ClientCheckVersionMessage
  | ClientDiffMessage
  | ClientSelectionMessage
  | ClientRestartMessage
  | ClientUnsubscribeMessage;

type ServerConnectionsMessage = {
  type: 'connections';
  participant_list: Participant[];
};

export type ServerDocDataMessage = {
  type: 'doc_data';
  doc: { content: Node, v: number };
  doc_info: { id: string, session_id: string, updated: any, version: number }; // TODO: do we need this?
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

export type ServerMessage = StandardMessage
  | ServerConnectionsMessage
  | ServerDocDataMessage
  | ServerDiffMessage
  | ServerErrorMessage
  | { type: 'subscribed' | 'patch_error' | 'welcome' };

export type SocketMessage = ClientMessage | ServerMessage;
