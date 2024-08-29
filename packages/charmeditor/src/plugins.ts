import { react } from '@nytimes/react-prosemirror';
import type { Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';

// TODO: Dont rely on this module for schemas
import { buildPlugins } from './buildPlugins';
import { plugins as boldPlugins } from './extensions/bold';
import { plugins as hardBreakPlugins } from './extensions/hardBreak';
import { plugins as historyPlugins } from './extensions/history';
import { plugins as italicPlugins } from './extensions/italic';
import { plugins as listItemPlugins } from './extensions/listItem/listItemPlugins';
import { plugins as tabIndentPlugins } from './extensions/tabIndent';

export const plugins = (schema: Schema): Plugin[] => [
  // You must add the react plugin if you use
  // the useNodeViews or useNodePos hook.
  react(),
  ...buildPlugins(schema, [
    historyPlugins(),
    boldPlugins(),
    italicPlugins(),
    listItemPlugins(),
    hardBreakPlugins(),
    // tabIndent should be triggered last so other plugins can override the keymap
    tabIndentPlugins()
  ])
];
