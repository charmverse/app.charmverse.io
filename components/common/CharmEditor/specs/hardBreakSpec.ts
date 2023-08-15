import { hardBreak } from '@bangle.dev/base-components';
import type { BaseRawNodeSpec } from '@bangle.dev/core';

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
