import { builders } from 'prosemirror-test-builder';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';

export const { doc, paragraph: p, heading, image: img } = builders(specRegistry.schema) as any;
