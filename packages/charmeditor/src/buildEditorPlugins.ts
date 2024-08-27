import type { InputRule } from 'prosemirror-inputrules';
import type { Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';

import { plugins as listItemPlugins } from './plugins/listItem/listItemPlugins';

export type PluginPayload<T = any> = {
  schema: Schema;
  // specRegistry: SpecRegistry;
  metadata: T;
};
export type RawBasePlugins = Plugin | InputRule | RawBasePlugins[];

export type RawPlugins<T = any> = RawBasePlugins | ((payLoad: PluginPayload<T>) => RawBasePlugins);

export function buildEditorPlugins() {
  return [listItemPlugins()];
}
