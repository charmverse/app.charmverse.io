import type { NodeSelection } from '@bangle.dev/pm';
import { Plugin, PluginKey, Decoration, DecorationSet } from '@bangle.dev/pm';

import type { TrackAttribute } from '../../track/interfaces';

import { findSelectedChanges } from './findSelectedChanges';
import { deactivateAllSelectedChanges } from './helpers';

export const key = new PluginKey('track');
export const selectedInsertionSpec = {};
export const selectedDeletionSpec = {};
export const selectedChangeFormatSpec = {};
export const selectedChangeBlockSpec = {};

interface Options {
  userId: string;
  username: string;
}

export function trackPlugin (options: Options) {
  return new Plugin({
    key,
    state: {
      init (config, state) {
        // Make sure there are colors for all users who have left marks
        // in the document and that they are registered as past
        // participants for the marginbox filter.
        const users: Record<string, string> = {};
        users[options.userId] = options.username;
        state.doc.descendants(node => {
          if (node.attrs.track) {
            node.attrs.track.forEach((track: TrackAttribute) => {
              if (
                !users[track.user] && track.user !== ''
              ) {
                users[track.user] = track.username;
              }
            });
          }
          else {
            node.marks.forEach(mark => {
              if (
                ['deletion', 'insertion', 'format_change'].includes(mark.type.name)
                                && !users[mark.attrs.user] && mark.attrs.user !== 0
              ) {
                users[mark.attrs.user] = mark.attrs.username;
              }
            });
          }
        });

        // if (options.editor.mod.collab) {
        //   Object.entries(users).forEach(([id, username]) => {
        //     const userId = parseInt(id);
        //     options.editor.mod.collab.colors.ensureUserColor(userId);
        //     if (!options.editor.mod.collab.pastParticipants.find(participant => participant.id === userId)) {
        //       options.editor.mod.collab.pastParticipants.push({ id: userId, name: username });
        //     }
        //   });

        // }

        return {
          decos: DecorationSet.empty
        };

      },
      apply (tr, prev, oldState, state) {
        const meta = tr.getMeta(key);
        if (meta) {
          // There has been an update, return values from meta instead
          // of previous values
          return meta;
        }

        let {
          decos
        } = this.getState(oldState);

        if (tr.selectionSet) {
          const { insertion, deletion, formatChange } = findSelectedChanges(state);
          decos = DecorationSet.empty;
          const decoType = (tr.selection as NodeSelection).node ? Decoration.node : Decoration.inline;
          if (insertion) {
            decos = decos.add(tr.doc, [decoType(insertion.from, insertion.to, {
              class: 'selected-insertion'
            }, selectedInsertionSpec)]);
          }
          if (deletion) {
            decos = decos.add(tr.doc, [decoType(deletion.from, deletion.to, {
              class: 'selected-deletion'
            }, selectedDeletionSpec)]);
          }
          if (formatChange) {
            decos = decos.add(tr.doc, [decoType(formatChange.from, formatChange.to, {
              class: 'selected-format_change'
            }, selectedChangeFormatSpec)]);
          }
        }
        else {
          decos = decos.map(tr.mapping, tr.doc);
        }
        return {
          decos
        };
      }
    },
    props: {
      decorations (state) {
        const {
          decos
        } = this.getState(state);
        return decos;
      }
      // handleDOMEvents: {
      //   focus: (view, _event) => {
      //     // const otherView = view === options.editor.view ? options.editor.mod.footnotes.fnEditor.view : options.editor.view;
      //     // otherView.dispatch(deactivateAllSelectedChanges(otherView.state.tr));
      //     return false;
      //   }
      // }
    }
  });
}
