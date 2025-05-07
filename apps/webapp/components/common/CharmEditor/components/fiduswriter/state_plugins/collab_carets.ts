import { sendableSteps } from 'prosemirror-collab';
import type { EditorState } from 'prosemirror-state';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import type { ClientSelectionMessage } from 'lib/websockets/documentEvents/interfaces';

const key = new PluginKey('collabCarets');

type CaretPosition = {
  anchor: number;
  head: number;
  decoSpec: { id: string };
  sessionId: string;
  userId: string;
};
type CaretUpdate = { anchor: number; head: number };
type Collaborator = { id: string; name: string };

type CollabState = {
  decos: DecorationSet;
  caretPositions: CaretPosition[];
  caretUpdate: CaretUpdate | false;
};

export const getSelectionUpdate = function (state: EditorState): CaretUpdate {
  const { caretUpdate } = key.getState(state);
  return caretUpdate;
};

export const updateCollaboratorSelection = function (
  state: EditorState,
  collaborator: Collaborator,
  data: ClientSelectionMessage
) {
  let { decos, caretPositions } = key.getState(state) as CollabState;

  const oldCarPos = caretPositions.find((carPos) => carPos.sessionId === data.session_id);

  if (oldCarPos) {
    caretPositions = caretPositions.filter((carPos) => carPos !== oldCarPos);
    const removeDecos = decos.find().filter((deco) => deco.spec === oldCarPos.decoSpec);
    decos = decos.remove(removeDecos);
  }

  const widgetDom = document.createElement('div');
  const className = `user-${collaborator.id}`;
  widgetDom.classList.add('caret');
  widgetDom.classList.add(className);
  widgetDom.innerHTML = '<div class="caret-head"></div>';
  if (widgetDom.firstElementChild) {
    widgetDom.firstElementChild.classList.add(className);
    const tooltip = collaborator.name;
    widgetDom.title = tooltip;
    (widgetDom.firstElementChild as HTMLDivElement).title = tooltip;
  }
  const decoSpec = { id: data.session_id }; // We will compare the decoSpec object. Id not really needed.
  const newCarPos: CaretPosition = {
    sessionId: data.session_id,
    userId: collaborator.id,
    decoSpec,
    anchor: data.anchor,
    head: data.head
  };
  caretPositions.push(newCarPos);

  const widgetDeco = Decoration.widget(data.head, widgetDom, decoSpec);
  const addDecos = [widgetDeco];

  if (data.anchor !== data.head) {
    const from = data.head > data.anchor ? data.anchor : data.head;
    const to = data.anchor > data.head ? data.anchor : data.head;
    const inlineDeco = Decoration.inline(
      from,
      to,
      {
        class: `user-bg-${collaborator.id}`
      },
      decoSpec
    );
    addDecos.push(inlineDeco);
  }
  decos = decos.add(state.doc, addDecos);

  const tr = state.tr.setMeta(key, {
    decos,
    caretPositions,
    caretUpdate: false
  });

  return tr;
};

export const removeCollaboratorSelection = function (state: EditorState, data: { session_id: string }) {
  let { decos, caretPositions } = key.getState(state) as CollabState;

  const caretPosition = caretPositions.find((carPos) => carPos.sessionId === data.session_id);

  if (caretPosition) {
    caretPositions = caretPositions.filter((carPos) => carPos !== caretPosition);
    const removeDecos = decos.find().filter((deco) => deco.spec === caretPosition.decoSpec);
    decos = decos.remove(removeDecos);
    const tr = state.tr.setMeta(key, {
      decos,
      caretPositions,
      caretUpdate: false
    });
    return tr;
  }
  return false;
};

export const collabCaretsPlugin = function (options: { editor: { docInfo: { access_rights: string } } }) {
  return new Plugin({
    key,
    state: {
      init() {
        return {
          caretPositions: [],
          decos: DecorationSet.empty,
          caretUpdate: false
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
        let { decos, caretPositions } = plugin.getState(oldState) as CollabState;
        let caretUpdate: CaretUpdate | false = false;

        decos = decos.map(tr.mapping, tr.doc, {
          onRemove: (decoSpec) => {
            caretPositions = caretPositions.filter((carPos) => carPos.decoSpec !== decoSpec);
          }
        });
        if (
          tr.selectionSet &&
          !sendableSteps(state) &&
          !tr.getMeta('row-handle-is-dragging') &&
          !['review', 'review-tracked'].includes(options.editor.docInfo.access_rights)
        ) {
          caretUpdate = { anchor: tr.selection.anchor, head: tr.selection.head };
        }

        return {
          decos,
          caretPositions,
          caretUpdate
        };
      }
    },
    props: {
      decorations(state) {
        const _state = this.getState(state) as CollabState | undefined;
        return _state?.decos;
      }
    }
  });
};
