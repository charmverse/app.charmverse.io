import { log } from '@packages/core/log';
import type {
  ClientSubscribeMessage,
  SocketMessage,
  WrappedSocketMessage
} from '@packages/websockets/documentEvents/interfaces';
import { collab, sendableSteps } from 'prosemirror-collab';
import type { Node } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { FrontendParticipant } from 'components/common/CharmEditor/components/fiduswriter/collab';
import { emitSocketMessage } from 'hooks/useWebSocketClient';

import { ModCollab } from './collab';
import { collabCaretsPlugin, trackPlugin } from './state_plugins';
import {
  // ModTrack,
  acceptAllNoInsertions,
  amendTransaction
} from './track';
import type { ConnectionEvent } from './ws';
import { WebSocketConnector } from './ws';

type EditorModules = {
  collab: ModCollab;
};

type DocInfo = {
  id: string;
  confirmedDoc?: false | Node;
  session_id?: string;
  updated: Date | false;
  version: number;
};

type User = { id: string; username: string };

type EditorProps = {
  user: User;
  docId: string;
  enableSuggestionMode: boolean;
  onDocLoaded?: () => void;
  onParticipantUpdate?: (participants: FrontendParticipant[]) => void;
  onCommentUpdate?: VoidFunction;
};

// A smaller version of the original Editor class in fiduswriter, which renders the page layout as well as Prosemirror View
export class FidusEditor {
  user: User;

  client_id: number = Math.floor(Math.random() * 0xffffffff);

  clientTimeAdjustment = 0;

  docInfo: DocInfo;

  enableSuggestionMode: boolean = false;

  // @ts-ignore gets defined in initEditor
  mod: EditorModules = {};

  // @ts-ignore gets defined in initEditor
  schema: EditorState['schema'];

  statePlugins: [any, any][] = [];

  // @ts-ignore this.view is set in initEditor()
  view: EditorView;

  currentView: EditorView | null = null;

  ws?: WebSocketConnector;

  isOffline() {
    // console.log('isOffline?', navigator.onLine, this.ws?.connectionCount, this.ws?.socket?.connected);
    return (
      !navigator.onLine || (this.ws?.connectionCount && this.ws?.connectionCount > 0 && !this.ws?.socket.connected)
    );
  }

  // Whether the editor is currently waiting for a document update. Set to true
  // initially so that diffs that arrive before document has been loaded are not
  // dealt with.
  waitingForDocument = true;

  onDocLoaded: NonNullable<EditorProps['onDocLoaded']> = () => {};

  onCommentUpdate: VoidFunction = () => {};

  onParticipantUpdate: NonNullable<EditorProps['onParticipantUpdate']> = () => {};

  constructor({ user, docId, enableSuggestionMode, onDocLoaded, onParticipantUpdate, onCommentUpdate }: EditorProps) {
    this.user = user;
    if (onDocLoaded) {
      this.onDocLoaded = onDocLoaded;
    }
    if (onParticipantUpdate) {
      this.onParticipantUpdate = onParticipantUpdate;
    }

    if (onCommentUpdate) {
      this.onCommentUpdate = onCommentUpdate;
    }

    this.enableSuggestionMode = enableSuggestionMode;

    this.docInfo = {
      id: docId,
      confirmedDoc: false, // The latest doc as confirmed by the server.
      updated: false, // Latest update time stamp
      version: 1
    };

    this.statePlugins = [
      [collab, () => ({ clientID: this.client_id })],
      [collabCaretsPlugin, () => ({ editor: this })],
      // [accessRightsPlugin, () => ({ editor: this })],
      [trackPlugin, () => ({ editor: this })]
    ];
  }

  init(view: EditorView, authToken: string, onConnectionEvent: (event: ConnectionEvent) => void) {
    let resubscribed = false;

    this.ws = new WebSocketConnector({
      editor: this,
      anythingToSend: () => Boolean(sendableSteps(view.state)),
      authToken,
      initialMessage: () => {
        const message: ClientSubscribeMessage = {
          roomId: this.docInfo.id,
          type: 'subscribe'
        };
        // console.log('initialMessage connectionCount', this.ws?.connectionCount);
        if (this.ws?.connectionCount) {
          message.connection = this.ws.connectionCount;
        }
        return message;
      },
      onConnectionEvent,
      resubscribed: () => {
        resubscribed = true;
        if (this.mod.collab) {
          this.mod.collab.doc.awaitingDiffResponse = true; // wait sending diffs till the version is confirmed
        }
      },
      restartMessage: () => ({ type: 'get_document' }), // Too many messages have been lost and we need to restart
      receiveData: (data: WrappedSocketMessage<SocketMessage>) => {
        // if (document.body !== this.dom) {
        //   return; // user navigated away.
        // }
        switch (data.type) {
          case 'connections': {
            // define .sessionIds on each participant
            const participants = this.mod.collab.updateParticipantList(data.participant_list);
            if (resubscribed) {
              log.debug('Check version after getting connections message', { pageId: this.docInfo.id });
              // check version if only reconnected after being offline
              this.mod.collab.doc.checkVersion(); // check version to sync the doc
              resubscribed = false;
            }
            this.onParticipantUpdate(participants);
            break;
          }
          case 'doc_data':
            this.onDocLoaded(); // call this first so that the loading state is up-to-date before transactions occur
            try {
              this.mod.collab.doc.receiveDocument(data);
            } catch (error) {
              log.error('Error loading document from sockets', { data, error, pageId: this.docInfo.id });
              onConnectionEvent({ type: 'error', error: error as Error });
            }
            // console.log('received doc');
            break;
          case 'confirm_version':
            this.mod.collab.doc.cancelCurrentlyCheckingVersion();
            if (data.v !== this.docInfo.version) {
              this.mod.collab.doc.checkVersion();
              return;
            }
            this.mod.collab.doc.enableDiffSending();
            break;
          case 'selection_change':
            this.mod.collab.doc.cancelCurrentlyCheckingVersion();
            if (data.v !== this.docInfo.version) {
              log.debug('Check version after selection change', { pageId: this.docInfo.id });
              this.mod.collab.doc.checkVersion();
              return;
            }
            this.mod.collab.doc.receiveSelectionChange(data);
            break;
          case 'diff': {
            if (data.cid === this.client_id) {
              // The diff origins from the local user.
              this.mod.collab.doc.confirmDiff(data.rid);
              return;
            }
            if (data.v !== this.docInfo.version) {
              log.debug('Check version after diff', { pageId: this.docInfo.id });
              this.mod.collab.doc.checkVersion();
              return;
            }
            this.mod.collab.doc.receiveDiff(data);
            const isCommentUpdate = data.ds.find(
              (step) => step.stepType === 'addMark' && step.mark?.type === 'inline-comment'
            );
            if (isCommentUpdate) {
              this.onCommentUpdate();
            }
            break;
          }
          case 'confirm_diff':
            this.mod.collab.doc.confirmDiff(data.rid);
            break;
          case 'reject_diff':
            this.mod.collab.doc.rejectDiff(data.rid);
            break;
          case 'patch_error':
            onConnectionEvent({ type: 'error', error: new Error('Your document was out of sync and has been reset.') });
            break;
          case 'error':
            log.error('Error talking to socket server', data.message);
            onConnectionEvent({ type: 'error', error: new Error(data.message) });
            break;
          default:
            break;
        }
      },
      historyPlugin: view?.state.plugins.find((plugin) => (plugin as any).key === 'history$') ?? null
    });

    this.initEditor(view);
  }

  // TODO: support changes to access rights
  handleAccessRightModification() {
    log.warn('Access rights have been modified. This is not yet supported.');
    // // This function when invoked creates a copy of document in FW format and closes editor operation.
    // new ExportFidusFile(
    //   this.getDoc({ use_current_view: true }),
    //   this.mod.db.bibDB,
    //   this.mod.db.imageDB
    // );
    // const accessRightModifiedDialog = new Dialog({
    //   title: gettext('Access rights modified'),
    //   id: 'access_rights_modified',
    //   body: gettext('Your access rights were modified while you were offline, so we cannot save your work to the server any longer, and it is downloaded to your computer instead. Please consider importing it into a new document.'),
    //   buttons: [{
    //     text: gettext('Leave editor'),
    //     classes: 'fw-dark',
    //     click: () => {
    //       window.location.href = '/';
    //     }
    //   }],
    //   canClose: false
    // });
    // accessRightModifiedDialog.open();
    // this.close(); // Close the editor operations.
  }

  close() {
    log.debug('Disconnect socket client');
    if (this.ws) {
      this.ws.close();
    }
  }

  onBeforeUnload() {
    if (this.isOffline()) {
      alert(
        'Changes you made to the document since going offline will be lost, if you choose to close/refresh the tab or close the browser.'
      );
      return true;
    }
    this.close();
  }

  initEditor(view: EditorView) {
    view.setProps({
      dispatchTransaction: (tr) => {
        // console.log('dispatchTransaction', tr.meta);
        const trackedTr = amendTransaction(tr, view.state, this, this.enableSuggestionMode);
        if (!view.isDestroyed) {
          const { state: newState } = view.state.applyTransaction(trackedTr);
          view.updateState(newState);
          if (tr.steps.length) {
            this.docInfo.updated = new Date();
          }
          this.mod.collab.doc.sendToCollaborators();
        }
      }
    });
    this.view = view;
    this.schema = view.state.schema;
    // The editor that is currently being edited in -- main or footnote editor
    this.currentView = this.view;
    // eslint-disable-next-line no-new
    new ModCollab(this);
    // new ModTrack(this);
    // this.ws.init();
  }

  extractPagePath(step: any) {
    const sliceLength = step.slice?.content.length ?? 0;
    let marks: any[] = [];

    const content0 = step.slice?.content?.[0];

    if (!content0) {
      return null;
    }

    // Check if the step type is replace
    const isReplace = step.stepType === 'replace' && step.from === step.to;

    if (!isReplace) {
      return null;
    }

    if (sliceLength === 1) {
      marks =
        (content0.type === 'text'
          ? content0.marks
          : content0.type === 'paragraph'
            ? content0.content?.[0]?.marks
            : []) ?? [];
    } else if (sliceLength === 2) {
      const content1 = step.slice?.content?.[1];

      if (!content1) {
        return null;
      }

      const isImage = content0.type === 'image';
      const isParagraph = content1.type === 'paragraph';

      if (!isImage || !isParagraph) {
        return null;
      }

      marks = content1.content[0]?.marks ?? [];
    }

    if (marks.length === 0) {
      return null;
    }

    let href = null;
    if (marks[0].type === 'link') {
      href = marks[0].attrs.href;
    }

    if (href?.startsWith(window.location.origin)) {
      href = href.split('/').at(-1);
    }

    return href;
  }

  // Collect all components of the current doc. Needed for saving and export
  // filters
  getDoc(options: { useCurrentView?: boolean; changes?: string } = {}) {
    const doc: Node =
      this.isOffline() || Boolean(options.useCurrentView)
        ? // @ts-ignore
          this.view.docView.node
        : this.docInfo.confirmedDoc;
    const pmArticle =
      options.changes === 'acceptAllNoInsertions' ? acceptAllNoInsertions(doc).firstChild : doc.firstChild;

    let title = '';
    pmArticle?.firstChild?.forEach((child) => {
      if (!child.marks.find((mark) => mark.type.name === 'deletion')) {
        title += child.textContent;
      }
    });
    return {
      content: pmArticle?.toJSON(),
      title: title.substring(0, 255),
      version: this.docInfo.version,
      id: this.docInfo.id,
      updated: this.docInfo.updated
    };
  }
}
