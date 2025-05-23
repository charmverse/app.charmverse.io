import { MarkdownSerializer } from 'prosemirror-markdown';

import type { SpecRegistry } from '../components/@bangle.dev/core/specRegistry';

import { markdownLoader } from './markdownLoader';

// A markdown serializer which uses a node/mark schema's
// toMarkdown property to generate a markdown string
export const markdownSerializer = (specRegistry: SpecRegistry) => {
  const { serializer } = markdownLoader(specRegistry);
  return new MarkdownSerializer(serializer.node, serializer.mark);
};
