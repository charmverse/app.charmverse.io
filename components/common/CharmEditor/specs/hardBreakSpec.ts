import { hardBreak } from '@bangle.dev/base-components';

import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export function hardBreakSpec() {
  const nativeSpec = hardBreak.spec() as BaseRawNodeSpec;

  const charmHardBreakSpec: BaseRawNodeSpec = {
    ...nativeSpec,
    markdown: {
      toMarkdown: (state) => {
        state.write('\n');
      },
      parseMarkdown: {
        hardbreak: { node: 'hardBreak' }
      }
    }
  };

  return charmHardBreakSpec;
}
