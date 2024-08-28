import { react } from '@nytimes/react-prosemirror';
import type { Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';

import { buildPlugins } from './buildPlugins';
import { plugins as listItemPlugins } from './plugins/listItem/listItemPlugins';

export const plugins = (schema: Schema): Plugin[] => [
  // You must add the react plugin if you use
  // the useNodeViews or useNodePos hook.
  react(),
  ...buildPlugins(schema, [listItemPlugins()])
];
