
import { noSpaceTmp } from '../common/basic';

import type { ModCollab } from './index';

// const CSS_COLORS = [
//   '0,119,190',
//   '217,58,50',
//   '0,0,160',
//   '119,190,0',
//   '97,255,105',
//   '173,216,230',
//   '128,0,128',
//   '128,128,128',
//   '255,165,0'
// ];

const CSS_COLORS = [
  '--bg-turquoise',
  '--bg-orange',
  '--bg-yellow',
  '--bg-teal',
  '--bg-blue',
  '--bg-purple',
  '--bg-red',
  '--bg-pink',
  '--bg-gray'
];

/* Create a CSS stylesheet for the colors of all users. */
export class ModCollabColors {

  mod: ModCollab;

  userColorStyle: null | HTMLElement = null;

  colorIds: string[] = [];

  constructor (mod: ModCollab) {
    mod.colors = this;
    this.mod = mod;
    this.setup();
  }

  setup () {
    const styleContainers = document.createElement('temp');
    styleContainers.innerHTML = '<style type="text/css" id="user-colors"></style>';
    while (styleContainers.firstElementChild) {
      document.body.appendChild(styleContainers.firstElementChild);
    }
    this.userColorStyle = document.getElementById('user-colors');
  }

  ensureUserColor (userId: string) {
    /* We assign a color to each user. This color stays even if the user
        * disconnects or the participant list is being updated.
        */
    if (!(this.colorIds.includes(userId))) {
      this.colorIds.push(userId);
      this.provideUserColorStyles();
    }
  }

  // Ensure that there are at least the given number of user color styles.
  provideUserColorStyles () {
    if (this.userColorStyle) {
      this.userColorStyle.innerHTML = this.colorIds.map((id, index) => {
        const color = index < CSS_COLORS.length ? CSS_COLORS[index]
          : `${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)}`;
        return noSpaceTmp`
          .user-${id} {
            border-color: var(${color});
            text-decoration-color: var(${color});
          }
          .user-${id}.insertion {
            color: var(${color});
          }
          .user-bg-${id} {
            background-color: rgba(var(${color}-rgb), 0.2);
          }`;
      }).join('\n');
    }
  }

}
