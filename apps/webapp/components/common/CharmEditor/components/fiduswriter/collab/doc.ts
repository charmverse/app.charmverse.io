import { log } from '@charmverse/core/log';
import type {
  ServerDocDataMessage,
  ClientDiffMessage,
  ClientSelectionMessage
} from '@packages/websockets/documentEvents/interfaces';
import { sendableSteps, receiveTransaction } from 'prosemirror-collab';
import { EditorState } from 'prosemirror-state';
import type { Transaction, EditorStateConfig } from 'prosemirror-state';
import { Step } from 'prosemirror-transform';

import { getSelectionUpdate, updateCollaboratorSelection } from '../state_plugins';

import { Merge } from './merge';

import type { ModCollab } from './index';

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

  merge: Merge;

  constructor(mod: ModCollab) {
    mod.doc = this;
    this.mod = mod;
    this.merge = new Merge(mod);
  }

  cancelCurrentlyCheckingVersion() {
    this.currentlyCheckingVersion = false;
    window.clearTimeout(this.enableCheckVersion);
  }

  checkVersion() {
    this.mod.editor.ws?.send(() => {
      if (this.currentlyCheckingVersion || !this.mod.editor.docInfo.version) {
        return false;
      }
      this.currentlyCheckingVersion = true;
      this.enableCheckVersion = window.setTimeout(() => {
        this.currentlyCheckingVersion = false;
      }, 1000);
      if (this.mod.editor.ws?.socket.connected) {
        this.disableDiffSending();
      }
      return {
        type: 'check_version',
        v: this.mod.editor.docInfo.version
      };
    });
  }

  disableDiffSending() {
    this.awaitingDiffResponse = true;
    // If no answer has been received from the server within 2 seconds,
    // check the version
    this.sendNextDiffTimer = window.setTimeout(() => {
      this.awaitingDiffResponse = false;
      this.sendToCollaborators();
    }, 8000);
  }

  enableDiffSending() {
    window.clearTimeout(this.sendNextDiffTimer);
    this.awaitingDiffResponse = false;
    this.sendToCollaborators();
  }

  receiveDocument(data: ServerDocDataMessage) {
    this.cancelCurrentlyCheckingVersion();
    if (this.mod.editor.docInfo.confirmedDoc) {
      log.debug('merge document updates', {
        clientPageVersion: this.mod.editor.docInfo.version,
        pageId: this.mod.editor.docInfo.id,
        serverPageVersion: data.doc.v
      });
      this.merge.adjustDocument(data);
    } else {
      this.loadDocument(data);
    }
  }

  loadDocument({ doc, time, docInfo }: ServerDocDataMessage) {
    // Reset collaboration
    this.unconfirmedDiffs = {};
    if (this.awaitingDiffResponse) {
      this.enableDiffSending();
    }
    // Remember location hash to scroll there subsequently.
    const locationHash = window.location.hash;

    this.mod.editor.clientTimeAdjustment = Date.now() - time;

    this.mod.editor.docInfo = {
      ...docInfo,
      version: doc.v,
      updated: new Date()
    };
    const stateDoc = this.mod.editor.schema.nodeFromJSON(doc.content);

    const currentPlugins = this.mod.editor.view.state.plugins;
    const plugins = this.mod.editor.statePlugins
      .map((plugin) => {
        if (plugin[1]) {
          return plugin[0](plugin[1](doc));
        } else {
          return plugin[0]();
        }
      })
      // filter out plugins in case we already loaded the doc once
      .filter((plugin) => !currentPlugins.some((p) => (p as any).key === plugin.key));

    const stateConfig: EditorStateConfig = {
      schema: this.mod.editor.schema,
      doc: stateDoc,
      plugins: this.mod.editor.view.state.plugins.concat(plugins)
    };

    // Set document in prosemirror
    this.mod.editor.view.updateState(EditorState.create(stateConfig));
    this.mod.editor.view.setProps({ nodeViews: {} }); // Needed to initialize nodeViews in plugins
    // Set initial confirmed doc
    this.mod.editor.docInfo.confirmedDoc = this.mod.editor.view.state.doc;
    // deactivateWait();
    if (locationHash.length) {
      // this.mod.editor.scrollIdIntoView(locationHash.slice(1));
    }

    // DISABLED FOR NOW (Matt) - this moves the page around after first load
    // scroll to top in case we had to reset the content due to large payload
    // this.mod.editor.view.dispatch(this.mod.editor.view.state.tr.scrollIntoView());

    this.mod.editor.waitingForDocument = false;
  }

  sendToCollaborators() {
    // Handle either doc change and comment updates OR caret update. Priority
    // for doc change/comment update.
    this.mod.editor.ws?.send(() => {
      if (this.awaitingDiffResponse || this.mod.editor.waitingForDocument || this.receiving) {
        return false;
      } else if (sendableSteps(this.mod.editor.view.state)) {
        this.disableDiffSending();
        const stepsToSend = sendableSteps(this.mod.editor.view.state);

        if (!stepsToSend) {
          // no diff. abandon operation
          return false;
        }
        const rid = this.confirmStepsRequestCounter;
        this.confirmStepsRequestCounter += 1;

        const unconfirmedDiff: ClientDiffMessage = {
          type: 'diff',
          v: this.mod.editor.docInfo.version,
          ds: [],
          rid
        };

        unconfirmedDiff.cid = this.mod.editor.client_id;

        if (stepsToSend) {
          unconfirmedDiff.ds = stepsToSend.steps.map((s) => s.toJSON() as any);
        }

        this.unconfirmedDiffs[rid] = {
          doc: this.mod.editor.view.state.doc,
          ...unconfirmedDiff
        };
        return unconfirmedDiff;
      } else if (this.mod.editor.currentView && getSelectionUpdate(this.mod.editor.currentView.state)) {
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
          head: selectionUpdate.head
        } as ClientSelectionMessage;
      } else {
        return false;
      }
    });
  }

  receiveSelectionChange(data: ClientSelectionMessage) {
    const participant = this.mod.participants.find((par) => par.id === data.id);

    if (!participant) {
      // participant is still unknown to us. Ignore
      return;
    }
    const tr = updateCollaboratorSelection(this.mod.editor.view.state, participant, data);
    if (tr) {
      this.mod.editor.view.dispatch(tr);
    }
  }

  receiveDiff(data: ClientDiffMessage, serverFix = false) {
    this.mod.editor.docInfo.version += 1;
    // data.cid is for server generated diff events, that was triggered by another action
    if ((data.ds && data.cid) || data.cid === -1) {
      // document steps
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

  setConfirmedDoc(tr: Transaction, stepsLength: number) {
    // Find the latest version of the doc without any unconfirmed local changes

    const rebased = tr.getMeta('rebased');
    const docNumber = rebased + stepsLength;

    this.mod.editor.docInfo.confirmedDoc = docNumber === tr.docs.length ? tr.doc : tr.docs[docNumber];
  }

  confirmDiff(requestId: number) {
    const unconfirmedDiffs = this.unconfirmedDiffs[requestId];
    if (!unconfirmedDiffs) {
      return;
    }
    this.mod.editor.docInfo.version += 1;

    const sentSteps = unconfirmedDiffs.ds; // document steps
    if (sentSteps) {
      const ourIds = sentSteps.map((_step) => this.mod.editor.client_id);
      const tr = receiveTransaction(
        this.mod.editor.view.state,
        // @ts-ignore because `Step` is roughly the same as `ProsemirrorJSONStep`
        sentSteps,
        ourIds,
        {
          // add content inserted at the cursor after the cursor instead of before
          mapSelectionBackward: true
        }
      );
      this.mod.editor.view.dispatch(tr);
      this.mod.editor.docInfo.confirmedDoc = unconfirmedDiffs.doc;
    }

    delete this.unconfirmedDiffs[requestId];
    this.enableDiffSending();
  }

  rejectDiff(requestId: number) {
    delete this.unconfirmedDiffs[requestId];
    this.enableDiffSending();
  }

  applyDiffs(diffs: any[], cid: number) {
    this.receiving = true;
    const steps = diffs.map((j) => Step.fromJSON(this.mod.editor.schema, j));
    const clientIds = diffs.map((_) => cid);
    const tr = receiveTransaction(this.mod.editor.view.state, steps, clientIds, {
      // add content inserted at the cursor after the cursor instead of before
      mapSelectionBackward: true
    });
    tr.setMeta('addToHistory', false);
    tr.setMeta('remote', true);
    this.mod.editor.view.dispatch(tr);
    this.setConfirmedDoc(tr, steps.length);
    this.receiving = false;
    this.sendToCollaborators();
  }
}
