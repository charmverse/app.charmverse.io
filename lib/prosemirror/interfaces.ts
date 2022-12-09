import type { PluginKey } from 'prosemirror-state';

import type { PluginState as SuggestTooltipPluginState } from 'components/common/CharmEditor/components/@bangle.dev/tooltip/suggest-tooltip';

export interface SuggestPluginState {
  tooltipContentDOM: HTMLElement;
  markName: string;
  suggestTooltipKey: PluginKey<SuggestTooltipPluginState>;
}
