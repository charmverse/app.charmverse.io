import type { ClientDiffMessage } from '@packages/pages/generateFirstDiff';
import type { Node } from 'prosemirror-model';

export type Participant = {
  id: string;
  avatar?: string | null;
  name: string;
  session_id?: string | undefined;
};

export type WrappedSocketMessage<T> = T & {
  c: number; // client
  s: number; // server
};

// Messages sent by both client and server

export type RequestResendMessage = {
  type: 'request_resend';
  from: number;
};

export type ConfirmVersionMessage = {
  type: 'confirm_version';
  v: number;
};

type StandardMessage = ConfirmVersionMessage | RequestResendMessage;

// Messages sent by the client

export type ClientRestartMessage = {
  type: 'get_document';
};

export type ClientCheckVersionMessage = {
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

export type ProsemirrorJSONStep = {
  stepType: 'replace' | 'addMark';
  from: number;
  to: number;
  slice?: {
    content?: {
      type: string;
      attrs?: any;
      marks?: { type: string; attrs: any }[];
      content?: any[];
      text?: string;
    }[];
  };
  mark?: {
    type: string;
    attrs: Record<string, any>;
  };
};

export type ClientSubscribeMessage = {
  type: 'subscribe';
  roomId: string;
  connection?: number;
};

export type ClientUnsubscribeMessage = {
  type: 'unsubscribe';
  roomId: string;
};

export type ClientMessage =
  | StandardMessage
  | ClientSubscribeMessage
  | ClientCheckVersionMessage
  | ClientDiffMessage
  | ClientSelectionMessage
  | ClientRestartMessage
  | ClientUnsubscribeMessage;

// Messages sent by the server

type ServerConnectionsMessage = {
  type: 'connections';
  participant_list: Participant[];
};

export type ServerDocDataMessage = {
  type: 'doc_data';
  doc: { content: Node; v: number };
  docInfo: { id: string; session_id: string; version: number }; // TODO: do we need this?
  time: number;
  m?: ClientDiffMessage[];
};

export type ServerDiffMessage = {
  type: 'confirm_diff' | 'reject_diff';
  rid: number;
};

export type ServerErrorMessage = {
  type: 'error';
  message: string;
};

export type PatchError = {
  type: 'patch_error';
};

export type ServerMessage =
  | StandardMessage
  | ServerConnectionsMessage
  | ServerDocDataMessage
  | ServerDiffMessage
  | ServerErrorMessage
  | PatchError
  | { type: 'subscribed' | 'patch_error' | 'welcome' };

export type SocketMessage = ClientMessage | ServerMessage;
