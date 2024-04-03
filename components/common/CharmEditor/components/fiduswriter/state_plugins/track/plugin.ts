import { Plugin, PluginKey } from 'prosemirror-state';
import type { NodeSelection } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import type { FidusEditor } from '../../fiduseditor';
import type { TrackAttribute } from '../../track/interfaces';

import { findSelectedChanges } from './findSelectedChanges';

export const key = new PluginKey('track');
export const selectedInsertionSpec = {};
export const selectedDeletionSpec = {};
export const selectedChangeFormatSpec = {};
export const selectedChangeBlockSpec = {};

interface Options {
  editor: FidusEditor;
}

export function trackPlugin(options: Options) {
  return new Plugin({
    key,
    state: {
      init(config, state) {
        // Make sure there are colors for all users who have left marks
        // in the document and that they are registered as past
        // participants for the marginbox filter.
        const users: Record<string, string> = {};
        users[options.editor.user.id] = options.editor.user.username;
        state.doc.descendants((node) => {
          if (node.attrs.track) {
            node.attrs.track.forEach((track: TrackAttribute) => {
              if (!users[track.user] && track.user !== '') {
                users[track.user] = track.username;
              }
            });
          } else {
            node.marks.forEach((mark) => {
              if (
                ['deletion', 'insertion', 'format_change'].includes(mark.type.name) &&
                !users[mark.attrs.user] &&
                mark.attrs.user !== 0
              ) {
                users[mark.attrs.user] = mark.attrs.username;
              }
            });
          }
        });

        if (options.editor.mod.collab) {
          Object.entries(users).forEach(([userId, username]) => {
            options.editor.mod.collab.colors.ensureUserColor(userId, username);
            if (!options.editor.mod.collab.pastParticipants.some((participant) => participant.id === userId)) {
              options.editor.mod.collab.pastParticipants.push({ id: userId, name: username });
            }
          });
        }

        return {
          decos: DecorationSet.empty
        };
      },
      apply(tr, prev, oldState, state) {
        const meta = tr.getMeta(key);
        if (meta) {
          // There has been an update, return values from meta instead
          // of previous values
          return meta;
        }

        const plugin = this as unknown as Plugin;
        let { decos } = plugin.getState(oldState);

        if (tr.selectionSet) {
          const { insertion, deletion, formatChange } = findSelectedChanges(state);
          decos = DecorationSet.empty;
          const decoType = (tr.selection as NodeSelection).node ? Decoration.node : Decoration.inline;
          if (insertion) {
            decos = decos.add(tr.doc, [
              decoType(
                insertion.from,
                insertion.to,
                {
                  class: 'selected-insertion'
                },
                selectedInsertionSpec
              )
            ]);
          }
          if (deletion) {
            decos = decos.add(tr.doc, [
              decoType(
                deletion.from,
                deletion.to,
                {
                  class: 'selected-deletion'
                },
                selectedDeletionSpec
              )
            ]);
          }
          if (formatChange) {
            decos = decos.add(tr.doc, [
              decoType(
                formatChange.from,
                formatChange.to,
                {
                  class: 'selected-format_change'
                },
                selectedChangeFormatSpec
              )
            ]);
          }
        } else {
          decos = decos.map(tr.mapping, tr.doc);
        }
        return {
          decos
        };
      }
    },
    props: {
      decorations(state) {
        const _state = this.getState(state) as { decos: any } | undefined;
        return _state?.decos;
      }
    }
  });
}
