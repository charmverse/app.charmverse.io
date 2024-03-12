import type { BaseRawMarkSpec, BaseRawNodeSpec } from '@bangle.dev/core';

import { SpecRegistry } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export function markdownLoader(specRegistry = new SpecRegistry()) {
  const tokens: { [key: string]: any } = Object.fromEntries(
    specRegistry.spec
      .filter((e) => e.markdown && e.markdown.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown?.parseMarkdown || {});
      })
  );

  const nodeSerializer: {
    [k: string]: NonNullable<BaseRawNodeSpec['markdown']>['toMarkdown'];
  } = {};

  for (const spec of specRegistry.spec) {
    if (spec.type === 'node' && spec.markdown?.toMarkdown) {
      nodeSerializer[spec.name] = spec.markdown.toMarkdown;
    }
  }

  const markSerializer: {
    [k: string]: NonNullable<BaseRawMarkSpec['markdown']>['toMarkdown'];
  } = {};

  for (const spec of specRegistry.spec) {
    if (spec.type === 'mark' && spec.markdown?.toMarkdown) {
      markSerializer[spec.name] = spec.markdown.toMarkdown;
    }
  }

  return {
    tokens,
    serializer: {
      node: nodeSerializer,
      mark: markSerializer
    }
  };
}
