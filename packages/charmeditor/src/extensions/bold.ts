import { toggleMark } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import type { DOMOutputSpec, Schema } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';

import type { RawPlugins } from '../buildPlugins';
import type { BaseRawMarkSpec } from '../buildSchema';
import { assertNotUndefined, isMarkActiveInSelection, markInputRule, markPasteRule } from '../utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBold,
  queryIsBoldActive
};

export const defaultKeys = {
  toggleBold: 'Mod-b'
};

const name = 'bold';

const getTypeFromSchema = (schema: Schema) => {
  const markType = schema.marks[name];
  assertNotUndefined(markType, `markType ${name} not found`);
  return markType;
};
function specFactory(): BaseRawMarkSpec {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'strong'
        },
        {
          tag: 'b',
          // making node any type as there is some problem with pm-model types
          getAttrs: (node: any) => node.style.fontWeight !== 'normal' && null
        },
        {
          style: 'font-weight',
          getAttrs: (value: any) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
        }
      ],
      toDOM: (): DOMOutputSpec => ['strong', 0]
    },
    markdown: {
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true
      },
      parseMarkdown: {
        strong: { mark: name }
      }
    }
  };
}

function pluginsFactory(): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g, type),
      markPasteRule(/(?:^|\s)((?:__)((?:[^__]+))(?:__))/g, type),
      markInputRule(/(?:^|\s)((?:__)((?:[^__]+))(?:__))$/, type),
      markInputRule(/(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/, type),
      keymap({ [defaultKeys.toggleBold]: toggleBold() })
    ];
  };
}

export function toggleBold(): Command {
  return (state, dispatch, _view) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return toggleMark(markType)(state, dispatch);
  };
}

export function queryIsBoldActive() {
  return (state: EditorState) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);
    return isMarkActiveInSelection(markType)(state);
  };
}
