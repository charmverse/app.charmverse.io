import { Plugin, PluginKey } from 'prosemirror-state';

import type { RawPlugins } from '../../buildPlugins';

// Prevent any changes to the document
export function plugins(): RawPlugins {
  return [
    new Plugin({
      key: new PluginKey('readonly'),
      filterTransaction: (transaction) => {
        // Allow selections but prevent any other changes
        return transaction.docChanged === false;
      }
    })
  ];
}
