import { NodeView } from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';

import { insertNestedPage } from 'lib/prosemirror/insertNestedPage';

import { createTooltipDOM } from '../@bangle.dev/tooltip';
import type { SuggestTooltipRenderOpts } from '../@bangle.dev/tooltip';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';

import { nestedPageSuggestMarkName } from './nestedPage.constants';
import type { NestedPagePluginState } from './nestedPage.interfaces';

export function nestedPagePlugins({
  key,
  markName = nestedPageSuggestMarkName,
  tooltipRenderOpts = {
    placement: 'bottom-start'
  }
}: {
  markName?: string;
  key: PluginKey<NestedPagePluginState>;
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
}) {
  return () => {
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
        onEnter(_, __, view) {
          const selectedMenuItem = document.querySelector('.mention-selected');
          const value = selectedMenuItem?.getAttribute('data-value');
          const type = selectedMenuItem?.getAttribute('data-type');
          const path = selectedMenuItem?.getAttribute('data-path');

          if (view && value && type && path) {
            insertNestedPage(key, view, value, type, path);
          }
          return false;
        },
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        }
      }),
      NodeView.createPlugin({
        name: 'page',
        containerDOM: ['div', { class: 'page-container' }]
      })
    ];
  };
}
