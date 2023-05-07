import type { Node } from 'prosemirror-model';
import { builders } from 'prosemirror-test-builder';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';

type Builder = (...args: (string | Node | object)[]) => Node;

const builderMap = builders(specRegistry.schema) as any as Record<string, Builder>;

export const { doc, paragraph: p, heading, image: img, poll } = builderMap;
