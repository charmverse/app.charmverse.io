import type { Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';

import { buildPlugins } from './buildPlugins';
import { plugins as boldPlugins } from './extensions/bold';
import { plugins as hardBreakPlugins } from './extensions/hardBreak';
import { plugins as historyPlugins } from './extensions/history';
import { plugins as italicPlugins } from './extensions/italic';
import { plugins as linkPlugins } from './extensions/link/linkPlugins';
import { plugins as listItemPlugins } from './extensions/listItem/listItemPlugins';
import { plugins as tabIndentPlugins } from './extensions/tabIndent';
import type { ExtensionGroup } from './schema';

export const groups: Record<ExtensionGroup, (schema: Schema) => Plugin[]> = {
  product_updates: (schema) =>
    buildPlugins(schema, [
      boldPlugins(),
      hardBreakPlugins(),
      historyPlugins(),
      italicPlugins(),
      listItemPlugins(),
      // tabIndent should be triggered last so other plugins can override the keymap
      tabIndentPlugins()
    ]),
  tokengate_message: (schema) =>
    buildPlugins(schema, [
      boldPlugins(),
      hardBreakPlugins(),
      historyPlugins(),
      italicPlugins(),
      listItemPlugins(),
      linkPlugins(),
      tabIndentPlugins()
    ])
};
