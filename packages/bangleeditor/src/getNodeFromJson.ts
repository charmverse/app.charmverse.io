import type { Node } from 'prosemirror-model';

import { specRegistry } from './specRegistry';

export function getNodeFromJson(content: any): Node {
  return specRegistry.schema.nodeFromJSON(content);
}
