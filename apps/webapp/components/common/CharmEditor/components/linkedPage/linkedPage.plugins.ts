import {
  linkedPageNodeName,
  linkedPageSuggestMarkName
} from '@packages/bangleeditor/components/linkedPage/linkedPage.constants';
import { Plugin, PluginKey } from 'prosemirror-state';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import { insertLinkedPage } from 'lib/prosemirror/insertLinkedPage';

import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import type { SuggestTooltipRenderOpts } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggestTooltipPlugin';

import type { LinkedPagePluginState } from './linkedPage.interfaces';

export function linkedPagePlugins({
  key,
  markName = linkedPageSuggestMarkName,
  tooltipRenderOpts = {
    placement: 'bottom-start'
  }
}: {
  markName?: string;
  key: PluginKey<LinkedPagePluginState>;
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
            insertLinkedPage(key, view, value, type, path);
          }
          return false;
        },
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        }
      }),
      NodeView.createPlugin({
        name: linkedPageNodeName,
        containerDOM: ['div', { class: 'linkedPage-container' }]
      })
    ];
  };
}
