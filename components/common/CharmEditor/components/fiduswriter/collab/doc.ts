/* eslint-disable */

import type { Transaction } from '@bangle.dev/pm';
import { Node, Step, EditorState } from '@bangle.dev/pm';
import { sendableSteps, receiveTransaction } from 'prosemirror-collab';

import type { ModCollab } from './index';

import { toMiniJSON } from '../schema/mini_json';
import {
  getSelectionUpdate,
  removeCollaboratorSelection,
  updateCollaboratorSelection
} from '../state_plugins';

import { ServerDocDataMessage, ClientDiffMessage, ClientSelectionMessage } from 'lib/websockets/documentEvents';


export class ModCollabDoc {

  mod: ModCollab;
  unconfirmedDiffs: Record<string, ClientDiffMessage> = {};
  confirmStepsRequestCounter = 0;
  awaitingDiffResponse = false;
  receiving = false;
  currentlyCheckingVersion = false;
  enableCheckVersion = 0;
  sendNextDiffTimer = 0;
  lastSelectionUpdateState?: EditorState;

  confirmedJson: any;

  constructor (mod: ModCollab) {
    mod.doc = this;
    this.mod = mod;
  }

  cancelCurrentlyCheckingVersion () {
    this.currentlyCheckingVersion = false;
    window.clearTimeout(this.enableCheckVersion);
  }

  checkVersion () {
    this.mod.editor.ws?.send(() => {
      if (this.currentlyCheckingVersion || !this.mod.editor.docInfo.version) {
        return false;
      }
      this.currentlyCheckingVersion = true;
      this.enableCheckVersion = window.setTimeout(
        () => {
          this.currentlyCheckingVersion = false;
        },
        1000
      );
      if (this.mod.editor.ws?.socket.connected) {
        this.disableDiffSending();
      }
      return {
        type: 'check_version',
        v: this.mod.editor.docInfo.version
      };
    });
  }

  disableDiffSending () {
    this.awaitingDiffResponse = true;
    // If no answer has been received from the server within 2 seconds,
    // check the version
    this.sendNextDiffTimer = window.setTimeout(
      () => {
        this.awaitingDiffResponse = false;
        this.sendToCollaborators();
      },
      8000
    );
  }

  enableDiffSending () {
    window.clearTimeout(this.sendNextDiffTimer);
    this.awaitingDiffResponse = false;
    this.sendToCollaborators();
  }

  receiveDocument (data: ServerDocDataMessage) {
    this.cancelCurrentlyCheckingVersion();
    if (this.mod.editor.docInfo.confirmedDoc) {
      //this.merge.adjustDocument(data);
      console.error('TODO: merge document updates');
    }
    else {
      console.log('loadDocument()');
      this.loadDocument(data);
    }
  }

  loadDocument ({ doc, time, doc_info }: ServerDocDataMessage) {
    // Reset collaboration
    this.unconfirmedDiffs = {};
    if (this.awaitingDiffResponse) {
      this.enableDiffSending();
    }
    // Remember location hash to scroll there subsequently.
    const locationHash = window.location.hash;

    this.mod.editor.clientTimeAdjustment = Date.now() - time;

    this.mod.editor.docInfo = doc_info;
    this.mod.editor.docInfo.version = doc.v;
    this.mod.editor.docInfo.updated = new Date();
    const stateDoc = this.mod.editor.schema.nodeFromJSON(doc.content);
    const plugins = this.mod.editor.statePlugins.map(plugin => {
      if (plugin[1]) {
        return plugin[0](plugin[1](doc));
      }
      else {
        return plugin[0]();
      }
    });
    console.log('load plugins!', stateDoc)
    const stateConfig = {
      schema: this.mod.editor.schema,
      doc: stateDoc,
      plugins: this.mod.editor.view.state.plugins.concat(plugins)
    };

    // Set document in prosemirror
    this.mod.editor.view.setProps({ state: EditorState.create(stateConfig) });
    this.mod.editor.view.setProps({ nodeViews: {} }); // Needed to initialize nodeViews in plugins
    // Set initial confirmed doc
    this.mod.editor.docInfo.confirmedDoc = this.mod.editor.view.state.doc;

    //deactivateWait();
    if (locationHash.length) {
      //this.mod.editor.scrollIdIntoView(locationHash.slice(1));
    }
    this.mod.editor.waitingForDocument = false;

  }

  sendToCollaborators () {
    // Handle either doc change and comment updates OR caret update. Priority
    // for doc change/comment update.
    this.mod.editor.ws?.send(() => {
      if (
        this.awaitingDiffResponse
                || this.mod.editor.waitingForDocument
                || this.receiving
      ) {
        return false;
      }
      else if (
        sendableSteps(this.mod.editor.view.state)
      ) {
        this.disableDiffSending();
        const stepsToSend = sendableSteps(this.mod.editor.view
          .state);

        if (!stepsToSend) {
          // no diff. abandon operation
          return false;
        }
        const rid = this.confirmStepsRequestCounter++;

        const unconfirmedDiff: ClientDiffMessage = {
          type: 'diff',
          v: this.mod.editor.docInfo.version,
          rid
        };

        unconfirmedDiff.cid = this.mod.editor.client_id;

        if (stepsToSend) {
          unconfirmedDiff.ds = stepsToSend.steps.map(
            s => s.toJSON()
          );
          // In case the title changed, we also add a title field to
          // update the title field instantly - important for the
          // document overview page.
          let newTitle = '';
          this.mod.editor.view.state.doc.firstChild?.firstChild?.forEach(
            child => {
              if (!child.marks.find(mark => mark.type.name === 'deletion')) {
                newTitle += child.textContent;
              }
            }
          );
          newTitle = newTitle.slice(0, 255);
          let oldTitle = '';
          const confirmedDoc = this.mod.editor.docInfo.confirmedDoc;
          if (confirmedDoc) {
            confirmedDoc.firstChild?.firstChild?.forEach(
              (child: Node) => {
                if (!child.marks.find(mark => mark.type.name === 'deletion')) {
                  oldTitle += child.textContent;
                }
              }
            );
          }
          oldTitle = oldTitle.slice(0, 255);
          if (
            newTitle !== oldTitle
          ) {
            unconfirmedDiff.ti = newTitle;
          }
        }

        this.unconfirmedDiffs[rid] = {
          doc: this.mod.editor.view.state.doc,
          ...unconfirmedDiff
        };
        return unconfirmedDiff;

      }
      else if (this.mod.editor.currentView && getSelectionUpdate(this.mod.editor.currentView.state)) {
        const currentView = this.mod.editor.currentView;
        if (!currentView) {
          return false;
        }

        if (this.lastSelectionUpdateState === currentView.state) {
          // Selection update has been sent for this state already. Skip
          return false;
        }
        this.lastSelectionUpdateState = currentView.state;
        // Create a new caret as the current user
        const selectionUpdate = getSelectionUpdate(currentView.state);
        return {
          type: 'selection_change',
          id: this.mod.editor.user.id,
          v: this.mod.editor.docInfo.version,
          session_id: this.mod.editor.docInfo.session_id,
          anchor: selectionUpdate.anchor,
          head: selectionUpdate.head,
          // Whether the selection is in the footnote or the main editor
          editor: 'main'
        };
      }
      else {
        return false;
      }
    });

  }

  receiveSelectionChange (data: ClientSelectionMessage) {
    const participant = this.mod.participants.find(par => par.id === data.id);
    let tr;
    if (!participant) {
      // participant is still unknown to us. Ignore
      return;
    }
    tr = updateCollaboratorSelection(
      this.mod.editor.view.state,
      participant,
      data
    );
    if (tr) {
      this.mod.editor.view.dispatch(tr);
    }
  }

  receiveDiff (data: ClientDiffMessage, serverFix = false) {

    this.mod.editor.docInfo.version++;
    if (data.ds && data.cid) { // document steps
      this.applyDiffs(data.ds, data.cid);
    }

    if (serverFix) {
      this.cancelCurrentlyCheckingVersion();

      // There may be unsent local changes. Send them now after .5 seconds,
      // in case collaborators want to send something first.
      this.enableDiffSending();
      window.setTimeout(() => this.sendToCollaborators(), 500);

    }
  }

  setConfirmedDoc (tr: Transaction, stepsLength: number) {
    // Find the latest version of the doc without any unconfirmed local changes

    const rebased = tr.getMeta('rebased');
    const docNumber = rebased + stepsLength;

    this.mod.editor.docInfo.confirmedDoc = docNumber === tr.docs.length
      ? tr.doc
      : tr.docs[docNumber];

  }

  confirmDiff (request_id: number) {
    const unconfirmedDiffs = this.unconfirmedDiffs[request_id];
    if (!unconfirmedDiffs) {
      return;
    }
    this.mod.editor.docInfo.version++;

    const sentSteps = unconfirmedDiffs.ds; // document steps
    if (sentSteps) {
      const ourIds = sentSteps.map(
        _step => this.mod.editor.client_id
      );
      const tr = receiveTransaction(
        this.mod.editor.view.state,
        sentSteps,
        ourIds
      );
      this.mod.editor.view.dispatch(tr);
      if (unconfirmedDiffs.doc) {
        this.mod.editor.docInfo.confirmedDoc = unconfirmedDiffs.doc;
      }
    }

    delete this.unconfirmedDiffs[request_id];
    this.enableDiffSending();
  }

  rejectDiff (request_id: number) {
    delete this.unconfirmedDiffs[request_id];
    this.enableDiffSending();
  }

  applyDiffs (diffs: any[], cid: number) {
    this.receiving = true;
    const steps = diffs.map(j => Step.fromJSON(this.mod.editor.schema, j));
    const clientIds = diffs.map(_ => cid);
    const tr = receiveTransaction(
      this.mod.editor.view.state,
      steps,
      clientIds
    );
    tr.setMeta('remote', true);
    this.mod.editor.view.dispatch(tr);
    this.setConfirmedDoc(tr, steps.length);
    this.receiving = false;
    this.sendToCollaborators();
  }
}
