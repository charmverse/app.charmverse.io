import type { BaseRawMarkSpec, SpecRegistry } from '../@bangle.dev/core/specRegistry';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggestTooltipSpec';

import { paletteMarkName, trigger } from './config';

export const spec = specFactory;
function specFactory(): BaseRawMarkSpec {
  const _spec = suggestTooltip.spec({ markName: paletteMarkName, trigger, excludes: '_' });

  return {
    ..._spec,
    options: {
      ..._spec.options,
      trigger
    },
    markdown: {
      toMarkdown: {
        open: '',
        close: ''
      }
    }
  };
}
