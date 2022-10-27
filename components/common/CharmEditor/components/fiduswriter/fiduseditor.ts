import type {
  Node,
  EditorView,
  EditorState } from '@bangle.dev/pm';
import {
  collab,
  sendableSteps
} from 'prosemirror-collab';
import type { Socket } from 'socket.io-client';

import log from 'lib/log';

import { ModCollab } from './collab';
import {
  collabCaretsPlugin,
  trackPlugin
} from './state_plugins';
import {
  // ModTrack,
  acceptAllNoInsertions,
  amendTransaction
} from './track';
import type { ClientSubscribeMessage, SocketMessage } from './ws';
import { WebSocketConnector } from './ws';

type EditorModules = {
  collab: ModCollab;
}

type DocInfo = {
  id: string;
  confirmedDoc: false | Node;
  session_id?: string;
  updated: Date | false;
  version: number;
}

const gettext = (text: string) => text;

type User = { id: string, username: string }

type EditorProps = {
  authToken: string;
  socket: Socket;
  user: User;
  docId: string;
  view: EditorView;
  enableSuggestionMode: boolean;
}

// A smaller version of the original Editor class in fiduswriter, which renders the page layout as well as Prosemirror View
export class FidusEditor {

  user: User;

  client_id: number = Math.floor(Math.random() * 0xFFFFFFFF);

  clientTimeAdjustment = 0;

  docInfo: DocInfo;

  enableSuggestionMode: boolean = false;

  // @ts-ignore gets defined in initEditor
  mod: EditorModules = {};

  schema: EditorState['schema'];

  statePlugins: [any, any][] = [];

  // @ts-ignore this.view is set in initEditor()
  view: EditorView;

  currentView: EditorView | null = null;

  ws?: any;

  isOffline () {
    return !navigator.onLine || (this.ws?.connectionCount > 0 && !this.ws?.connected);
  }

  // Whether the editor is currently waiting for a document update. Set to true
  // initially so that diffs that arrive before document has been loaded are not
  // dealt with.
  waitingForDocument = true;

  constructor ({ authToken, user, docId, view, socket, enableSuggestionMode }: EditorProps) {

    this.user = user;

    this.enableSuggestionMode = enableSuggestionMode;

    this.docInfo = {
      id: docId,
      confirmedDoc: false, // The latest doc as confirmed by the server.
      updated: false, // Latest update time stamp
      version: 0
    };

    this.statePlugins = [
      [collab, () => ({ clientID: this.client_id })],
      [collabCaretsPlugin, () => ({ editor: this })],
      // [accessRightsPlugin, () => ({ editor: this })],
      [trackPlugin, () => ({ editor: this })]
    ];

    this.init(view, socket, authToken);
  }

  init (view: EditorView, socket: WebSocketConnector['socket'], authToken: string) {

    let resubscribed = false;

    this.ws = new WebSocketConnector({
      socket,
      appLoaded: () => Boolean(this.view.state.plugins.length),
      anythingToSend: () => Boolean(sendableSteps(this.view.state)),
      initialMessage: () => {
        const message: ClientSubscribeMessage = {
          roomId: this.docInfo.id,
          authToken,
          type: 'subscribe'
        };

        // if (this.ws.connectionCount) {
        //   message.connection = this.ws.connectionCount;
        // }
        return message;
      },
      resubscribed: () => {
        resubscribed = true;
        if (this.mod.collab) {
          this.mod.collab.doc.awaitingDiffResponse = true; // wait sending diffs till the version is confirmed
        }
      },
      restartMessage: () => ({ type: 'get_document' }), // Too many messages have been lost and we need to restart
      receiveData: (data: SocketMessage) => {
        // if (document.body !== this.dom) {
        //   return; // user navigated away.
        // }
        switch (data.type) {
          case 'connections':
            this.mod.collab.updateParticipantList(data.participant_list);
            if (resubscribed) { // check version if only reconnected after being offline
              this.mod.collab.doc.checkVersion(); // check version to sync the doc
              resubscribed = false;
            }
            break;
          case 'doc_data':
            this.mod.collab.doc.receiveDocument(data);
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
              this.mod.collab.doc.checkVersion();
              return;
            }
            this.mod.collab.doc.receiveSelectionChange(data);
            break;
          case 'diff':
            if (data.cid === this.client_id) {
              // The diff origins from the local user.
              this.mod.collab.doc.confirmDiff(data.rid);
              return;
            }
            if (data.v !== this.docInfo.version) {
              this.mod.collab.doc.checkVersion();
              return;
            }
            this.mod.collab.doc.receiveDiff(data);
            break;
          case 'confirm_diff':
            this.mod.collab.doc.confirmDiff(data.rid);
            break;
          case 'reject_diff':
            this.mod.collab.doc.rejectDiff(data.rid);
            break;
          case 'patch_error':
            alert(gettext('Your document was out of sync and has been reset.'));
            break;
          default:
            break;
        }
      }
      // failedAuth: () => {
      //   if (this.view.state.plugins.length && sendableSteps(this.view.state) && this.ws.connectionCount > 0) {
      //     this.ws.online = false; // To avoid Websocket trying to reconnect.
      //     new ExportFidusFile(
      //       this.getDoc({ use_current_view: true }),
      //       this.mod.db.bibDB,
      //       this.mod.db.imageDB
      //     );
      //     const sessionDialog = new Dialog({
      //       title: gettext('Session Expired'),
      //       id: 'session_expiration_dialog',
      //       body: gettext('Your session expired while you were offline, so we cannot save your work to the server any longer, and it is downloaded to your computer instead. Please consider importing it into a new document.'),
      //       buttons: [{
      //         text: gettext('Proceed to Login page'),
      //         classes: 'fw-dark',
      //         click: () => {
      //           window.location.href = '/';
      //         }
      //       }],
      //       canClose: false
      //     });
      //     sessionDialog.open();
      //   }
      //   else {
      //     window.location.href = '/';
      //   }
      // }
    });
    log.debug('enabled ws');

    this.initEditor(view);

  }

  // TODO: support changes to access rights
  handleAccessRightModification () {
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

  close () {
    if (this.ws) {
      this.ws.close();
    }
  }

  onBeforeUnload () {
    if (this.isOffline()) {
      alert('Changes you made to the document since going offline will be lost, if you choose to close/refresh the tab or close the browser.');
      return true;
    }
    this.close();
  }

  initEditor (view: EditorView) {

    view.setProps({
      dispatchTransaction: tr => {
        const trackedTr = amendTransaction(tr, this.view.state, this, this.enableSuggestionMode);
        const { state: newState } = this.view.state.applyTransaction(trackedTr);
        this.view.updateState(newState);
        if (tr.steps) {
          this.docInfo.updated = new Date();
        }
        // console.log('send to collaborators');
        this.mod.collab.doc.sendToCollaborators();
      }
    });
    this.view = view;
    this.schema = view.state.schema;
    // The editor that is currently being edited in -- main or footnote editor
    this.currentView = this.view;
    // eslint-disable-next-line no-new
    new ModCollab(this);
    // new ModTrack(this);
    this.ws.init();

  }

  // Collect all components of the current doc. Needed for saving and export
  // filters
  getDoc (options: { useCurrentView?: boolean, changes?: string } = {}) {
    const doc: Node = (this.isOffline() || Boolean(options.useCurrentView))
      // @ts-ignore
      ? this.view.docView.node
      : this.docInfo.confirmedDoc;
    const pmArticle = options.changes === 'acceptAllNoInsertions'
      ? acceptAllNoInsertions(doc).firstChild
      : doc.firstChild;

    let title = '';
    pmArticle?.firstChild?.forEach(
      child => {
        if (!child.marks.find(mark => mark.type.name === 'deletion')) {
          title += child.textContent;
        }
      }
    );
    return {
      content: pmArticle?.toJSON(),
      title: title.substring(0, 255),
      version: this.docInfo.version,
      id: this.docInfo.id,
      updated: this.docInfo.updated
    };
  }

}
