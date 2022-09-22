import { findTarget, setSelectedChanges, deactivateAllSelectedChanges } from './helpers';

import { reject } from './reject';
import { accept } from './accept';

// Helper functions related to tracked changes
export class ModTrack {
  constructor () {
    // editor.mod.track = this;
    // this.editor = editor;
    this.bindEvents();
  }

  bindEvents () {
    // Bind all the click events related to track changes
    document.body.addEventListener('click', event => {
      const el: { target?: HTMLElement | null } = {};
      switch (true) {
        case findTarget(event, '.track-accept', el): {
          let boxNumber = 0;
          let seekItem = el.target?.closest('.margin-box');
          while (seekItem?.previousElementSibling) {
            boxNumber += 1;
            seekItem = seekItem.previousElementSibling;
          }
          // const box = this.editor.mod.marginboxes.marginBoxes[boxNumber];
          // if (el.target) {
          //   accept(el.target.dataset.type ?? '', box.pos, this.editor.view);
          // }
          break;
        }
        case findTarget(event, '.track-reject', el): {
          let boxNumber = 0;
          let seekItem = el.target?.closest('.margin-box');
          while (seekItem?.previousElementSibling) {
            boxNumber += 1;
            seekItem = seekItem.previousElementSibling;
          }
          // const box = this.editor.mod.marginboxes.marginBoxes[boxNumber];
          // if (el.target) {
          //   reject(el.target.dataset.type ?? '', box.pos, this.editor.view);
          // }
          break;
        }
        default:
          break;
      }
    });
  }

}
