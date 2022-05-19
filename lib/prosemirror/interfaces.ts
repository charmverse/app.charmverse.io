import { SuggestTooltipPluginState } from 'components/common/CharmEditor/components/@bangle.dev/tooltip/suggest-tooltip';
import { PluginKey } from 'prosemirror-state';

export interface SuggestPluginState {
  tooltipContentDOM: HTMLElement
  markName: string
  suggestTooltipKey: PluginKey<SuggestTooltipPluginState>
}
