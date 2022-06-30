import { Plugin, RawPlugins } from '@bangle.dev/core';
import { PluginKey } from '@bangle.dev/pm';
import { createTooltipDOM, tooltipPlacement } from '@bangle.dev/tooltip';
import { referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';

export interface InlineVotePluginState {
  tooltipContentDOM: HTMLElement
  show: boolean
  ids: string[]
}

export function plugin ({ key } :{
  key: PluginKey
}): RawPlugins {
  const tooltipDOMSpec = createTooltipDOM();
  return [
    new Plugin<InlineVotePluginState>({
      key,
      state: {
        init () {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            ids: []
          };
        },
        apply (tr, pluginState) {
          const meta = tr.getMeta(key);
          if (meta === undefined) {
            return pluginState;
          }
          if (meta.type === 'RENDER_TOOLTIP') {
            return {
              ...pluginState,
              ...meta.value,
              show: true
            };
          }
          if (meta.type === 'HIDE_TOOLTIP') {
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              show: false,
              ids: []
            };
          }
          throw new Error('Unknown type');
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: key,
      renderOpts: {
        placement: 'bottom',
        tooltipDOMSpec,
        getReferenceElement: referenceElement(key, (state) => {
          const { selection } = state;
          return {
            end: selection.to,
            start: selection.from
          };
        })
      }
    })
  ];
}
