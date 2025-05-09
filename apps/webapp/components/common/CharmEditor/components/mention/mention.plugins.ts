import { Plugin, PluginKey } from 'prosemirror-state';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import type { SuggestTooltipRenderOpts } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggestTooltipPlugin';

import { mentionSuggestMarkName, mentionTrigger } from './mention.constants';
import type { MentionPluginState } from './mention.interfaces';
import { selectMention } from './mention.utils';

export function mentionPlugins({
  key,
  markName = mentionSuggestMarkName,
  tooltipRenderOpts = {
    placement: 'bottom-start'
  }
}: {
  markName?: string;
  key: PluginKey<MentionPluginState>;
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
}) {
  const suggestTooltipKey = new PluginKey('suggestTooltipKey');
  // We are converting to DOM elements so that their instances
  // can be shared across plugins.
  const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

  return [
    new Plugin({
      key,
      state: {
        init() {
          return {
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            markName,
            suggestTooltipKey
          };
        },
        apply(_, pluginState) {
          return pluginState;
        }
      }
    }),
    suggestTooltip.plugins({
      key: suggestTooltipKey,
      markName,
      trigger: mentionTrigger,
      onEnter(state, dispatch, view) {
        const selectedMenuItem = document.querySelector('.mention-selected');
        const value = selectedMenuItem?.getAttribute('data-value');
        const type = selectedMenuItem?.getAttribute('data-type');
        if (value && type && view) {
          return selectMention(key, value, type)(state, dispatch, view);
        }
        return false;
      },
      tooltipRenderOpts: {
        ...tooltipRenderOpts,
        tooltipDOMSpec
      }
    }),
    NodeView.createPlugin({
      name: 'mention',
      containerDOM: ['span', { class: 'mention-value' }]
    })
  ];
}
