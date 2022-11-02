import { Node } from '@bangle.dev/pm';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';

export function getNodeFromJson (content: any): Node {
  return Node.fromJSON(specRegistry.schema, content);
}
