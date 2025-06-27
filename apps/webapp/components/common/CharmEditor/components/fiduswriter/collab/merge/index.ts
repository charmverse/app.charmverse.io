import { getSettings } from '@packages/bangleeditor/components/fiduswriter/schema/convert';
import { log } from '@packages/core/log';
import type { ServerDocDataMessage } from '@packages/websockets/documentEvents/interfaces';
import { sendableSteps, receiveTransaction } from 'prosemirror-collab';
import type { Node } from 'prosemirror-model';
import type { Selection } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';
import type { StepMap } from 'prosemirror-transform';
import { Mapping, Step, Transform } from 'prosemirror-transform';

import { trackedTransaction, acceptAllNoInsertions } from '../../track';
import type { ModCollab } from '../index';

import { ChangeSet } from './changeset';
// import {
//   MergeEditor
// } from './editor';
import { recreateTransform } from './recreate_transform';
import { simplifyTransform } from './tools';

export class Merge {
  mod: ModCollab;

  remoteTrackOfflineLimit = 50; // Limit of remote changes while offline for tracking to kick in when multiple users edit

  trackOfflineLimit = 50; // Limit of local changes while offline for tracking to kick in when multiple users edit

  constructor(mod: ModCollab) {
    this.mod = mod;
  }

  adjustDocument(data: ServerDocDataMessage) {
    // Adjust the document when reconnecting after offline and many changes
    // happening on server.
    if (this.mod.editor.docInfo.version < data.doc.v && sendableSteps(this.mod.editor.view.state)) {
      log.debug('Update document with server changes', {
        messages: data.m?.length,
        serverPageVersion: data.doc.v,
        clientPageVersion: this.mod.editor.docInfo.version
      });
      this.mod.doc.receiving = true;
      const confirmedState = EditorState.create({ doc: this.mod.editor.docInfo.confirmedDoc || undefined });
      const unconfirmedTr = confirmedState.tr;
      const sendable = sendableSteps(this.mod.editor.view.state);
      if (sendable) {
        sendable.steps.forEach((step) => unconfirmedTr.step(step));
      }
      const rollbackTr = this.mod.editor.view.state.tr;
      unconfirmedTr.steps
        .slice()
        .reverse()
        .forEach((step, index) =>
          rollbackTr.step(step.invert(unconfirmedTr.docs[unconfirmedTr.docs.length - index - 1]))
        );
      // We reset to there being no local changes to send.
      this.mod.editor.view.dispatch(
        receiveTransaction(
          this.mod.editor.view.state,
          unconfirmedTr.steps,
          unconfirmedTr.steps.map((_step) => this.mod.editor.client_id),
          {
            // add content inserted at the cursor after the cursor instead of before
            mapSelectionBackward: true
          }
        )
      );
      this.mod.editor.view.dispatch(
        receiveTransaction(
          this.mod.editor.view.state,
          rollbackTr.steps,
          rollbackTr.steps.map((_step) => 'remote'),
          {
            // add content inserted at the cursor after the cursor instead of before
            mapSelectionBackward: true
          }
        ).setMeta('remote', true)
      );
      const toDoc = this.mod.editor.schema.nodeFromJSON(data.doc.content);
      // Apply the online Transaction
      let lostTr: Transform;
      if (data.m) {
        lostTr = new Transform(this.mod.editor.view.state.doc);
        data.m.forEach((message) => {
          if (message.ds && message.cid !== this.mod.editor.client_id) {
            message.ds.forEach((j) => lostTr.maybeStep(Step.fromJSON(this.mod.editor.schema, j)));
          }
        });
        if (!lostTr.doc.eq(toDoc)) {
          // We were not able to recreate the document using the steps in the diffs. So instead we recreate the steps artificially.
          lostTr = recreateTransform(this.mod.editor.view.state.doc, toDoc);
        }
      } else {
        lostTr = recreateTransform(this.mod.editor.view.state.doc, toDoc);
      }

      this.mod.editor.view.dispatch(
        receiveTransaction(
          this.mod.editor.view.state,
          lostTr.steps,
          lostTr.steps.map((_step) => 'remote'),
          {
            // add content inserted at the cursor after the cursor instead of before
            mapSelectionBackward: true
          }
        ).setMeta('remote', true)
      );

      // We split the complex steps that delete and insert into simple steps so that finding conflicts is more pronounced.
      const modifiedLostTr = simplifyTransform(lostTr);
      const lostChangeSet = new ChangeSet(modifiedLostTr);
      const conflicts = lostChangeSet.findConflicts(unconfirmedTr, modifiedLostTr);
      // Set the version
      this.mod.editor.docInfo.version = data.doc.v;

      // If no conflicts arises auto-merge the document
      let editor;
      if (conflicts.length > 0) {
        try {
          log.warn('TODO: support MergeEditor');
          // editor = new MergeEditor(
          //   this.mod.editor,
          //   confirmedState.doc,
          //   unconfirmedTr.doc,
          //   toDoc,
          //   unconfirmedTr,
          //   lostTr,
          //   { bibliography: data.doc.bibliography, images: data.doc.images }
          // );
          // editor.init();
        } catch (error) {
          this.handleMergeFailure(error, unconfirmedTr.doc, toDoc, editor);
        }
      } else {
        try {
          this.autoMerge(unconfirmedTr, lostTr, data, this.mod.editor.view.state.selection);
        } catch (error) {
          this.handleMergeFailure(error, unconfirmedTr.doc, toDoc);
        }
      }

      this.mod.doc.receiving = false;
      // this.mod.doc.sendToCollaborators()
    } else if (data.m) {
      log.debug('Update document with server changes', {
        messages: data.m.length,
        version: data.doc.v
      });
      // There are no local changes, so we can just receive all the remote messages directly
      data.m.forEach((message) => this.mod.doc.receiveDiff(message, true));
    } else {
      // The server seems to have lost some data. We reset.
      this.mod.doc.loadDocument(data);
      log.error('Server has lost data, reset the document');
    }
  }

  autoMerge(unconfirmedTr: Transform, lostTr: Transform, data: ServerDocDataMessage, selection?: Selection) {
    /* This automerges documents incase of no conflicts */
    const toDoc = this.mod.editor.schema.nodeFromJSON(data.doc.content);
    const rebasedTr = EditorState.create({ doc: toDoc, selection }).tr.setMeta('remote', true);
    const maps = new Mapping(
      ([] as StepMap[])
        .concat(
          unconfirmedTr.mapping.maps
            .slice()
            .reverse()
            .map((map) => map.invert())
        )
        .concat(lostTr.mapping.maps.slice())
    );

    unconfirmedTr.steps.forEach((step, index) => {
      const mapped = step.map(maps.slice(unconfirmedTr.steps.length - index));
      if (mapped && !rebasedTr.maybeStep(mapped).failed) {
        maps.appendMap(mapped.getMap());
        // @ts-ignore types are wrong
        maps.setMirror(
          unconfirmedTr.steps.length - index - 1,
          unconfirmedTr.steps.length + lostTr.steps.length + rebasedTr.steps.length - 1
        );
      }
    });

    // disable the following code which turns a users edits into suggestions.
    // In testing, the user was not able to accept the suggesitons, and it might be better to just let them undo changes via history UI

    // let tracked;
    // let rebasedTrackedTr; // offline steps to be tracked
    // if (
    //   // WRITE_ROLES.includes(this.mod.editor.docInfo.access_rights)
    //   // &&
    //   unconfirmedTr.steps.length > this.trackOfflineLimit ||
    //   lostTr.steps.length > this.remoteTrackOfflineLimit
    // ) {
    //   tracked = true;
    //   // Either this user has made 50 changes since going offline,
    //   // or the document has 20 changes to it. Therefore we add tracking
    //   // to the changes of this user and ask user to clean up.
    //   rebasedTrackedTr = trackedTransaction(
    //     rebasedTr,
    //     this.mod.editor.view.state,
    //     this.mod.editor.user,
    //     false,
    //     new Date(Date.now() - this.mod.editor.clientTimeAdjustment)
    //   );
    // } else {
    //   tracked = false;
    //   rebasedTrackedTr = rebasedTr;
    // }

    // this.mod.editor.docInfo.version = data.doc.v
    rebasedTr.setMeta('remote', true);
    this.mod.editor.view.dispatch(rebasedTr);

    // if (tracked) {
    //   log.warn(
    //     'Showed alert to user after auto-merge: The document was modified substantially by other users while you were offline'
    //   );
    //   alert(
    //     'The document was modified substantially by other users while you were offline. We have merged your changes in as tracked changes. You should verify that your edits still make sense.'
    //   );
    // }
  }

  getDocData(offlineDoc: Node) {
    const pmArticle = acceptAllNoInsertions(offlineDoc).firstChild;
    if (!pmArticle?.firstChild) {
      throw new Error('No child element of article');
    }
    let title = '';
    pmArticle.firstChild.forEach((child) => {
      if (!child.marks.find((mark) => mark.type.name === 'deletion')) {
        title += child.textContent;
      }
    });

    return {
      content: pmArticle.toJSON(),
      settings: getSettings(pmArticle),
      title,
      version: this.mod.editor.docInfo.version,
      id: this.mod.editor.docInfo.id,
      updated: this.mod.editor.docInfo.updated
    };
  }

  handleMergeFailure(error: unknown, offlineDoc: Node, _onlineDoc: Node, mergeEditor = false) {
    // In case the auto-merge or manual merge failed due to JS Errors,
    // make a copy of the offline doc available for download.
    log.error('TODO: Handle merge failure', { error });

    // Close the merge window if open
    // if (mergeEditor && document.querySelector('#editor-merge-view')) {
    //   mergeEditor.mergeDialog.close();
    //   // Close merge resolution warning if open
    //   if (document.querySelector('#merge-res-warning')) {
    //     mergeEditor.warningDialog.close();
    //   }
    // }

    // // Prepare Export
    // new ExportFidusFile(
    //   this.getDocData(offlineDoc),
    //   this.mod.editor.mod.db.bibDB,
    //   this.mod.editor.mod.db.imageDB
    // );

    // // Show up proper message
    // const mergeFailedDialog = new Dialog({
    //   title: gettext('Merge failed'),
    //   id: 'merge_failed',
    //   body: gettext('An error occurred during the merge process, so we cannot save your work to the server any longer, and it is downloaded to your computer instead. Please consider importing it into a new document.'),
    //   buttons: [{
    //     text: gettext('Leave editor'),
    //     classes: 'fw-dark',
    //     click: () => {
    //       window.location.href = '/';
    //     }
    //   }],
    //   canClose: false
    // });
    // mergeFailedDialog.open();

    // // Close the editor operations.
    // this.mod.editor.close();

    // Throw the error so it is logged.
    throw error;
  }
}
