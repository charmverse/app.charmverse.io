import { findTarget, setSelectedChanges, deactivateAllSelectedChanges } from './helpers';

import { reject } from './reject';
import { rejectAll } from './reject_all';
import { accept } from './accept';
import { acceptAll } from './accept_all';

// Helper functions related to tracked changes
export class ModTrack {
  constructor (editor) {
    editor.mod.track = this;
    this.editor = editor;
    this.bindEvents();
  }

  bindEvents () {
    // Bind all the click events related to track changes
    document.body.addEventListener('click', event => {
      const el: { target?: Element | null } = {};
      switch (true) {
        case findTarget(event, '.track-accept', el): {
          let boxNumber = 0;
          let seekItem = el.target?.closest('.margin-box');
          while (seekItem?.previousElementSibling) {
            boxNumber += 1;
            seekItem = seekItem.previousElementSibling;
          }
          const box = this.editor.mod.marginboxes.marginBoxes[boxNumber];
          if (el.target) {
            accept(el.target.dataset.type, box.pos, box.view === 'main' ? this.editor.view : this.editor.mod.footnotes.fnEditor.view);
          }
          break;
        }
        case findTarget(event, '.track-reject', el): {
          let boxNumber = 0;
          let seekItem = el.target?.closest('.margin-box');
          while (seekItem?.previousElementSibling) {
            boxNumber += 1;
            seekItem = seekItem.previousElementSibling;
          }
          const box = this.editor.mod.marginboxes.marginBoxes[boxNumber];
          if (el.target) {
            reject(el.target.dataset.type, box.pos, box.view === 'main' ? this.editor.view : this.editor.mod.footnotes.fnEditor.view);
          }
          break;
        }
        default:
          break;
      }
    });
  }

  activateTrack (type: string, pos: number) {
    // this.editor.mod.comments.interactions.deactivateAll();
    const view = this.editor.view;
    // const otherView = viewName === 'main' ? this.editor.mod.footnotes.fnEditor.view : this.editor.view;
    // remove all selected changes in other view
    // otherView.dispatch(deactivateAllSelectedChanges(otherView.state.tr));
    // activate selected change in relevant view
    const tr = setSelectedChanges(
      view.state,
      type,
      pos
    );
    if (tr) {
      this.editor.currentView = view;
      view.dispatch(tr);
    }
  }

  rejectAll () {
    rejectAll(this.editor.mod.footnotes.fnEditor.view);
    rejectAll(this.editor.view);
  }

  acceptAll () {
    acceptAll(this.editor.mod.footnotes.fnEditor.view);
    acceptAll(this.editor.view);
  }

}
