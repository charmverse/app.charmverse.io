import { RawSpecs } from '@bangle.dev/core';
import { Schema, Plugin, DOMOutputSpec, PluginKey } from '@bangle.dev/pm';
import { createTooltipDOM, SuggestTooltipRenderOpts, tooltipPlacement } from '@bangle.dev/tooltip';
import { referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';

const name = 'page';

export const NestedPagePluginKey = new PluginKey('suggest_tooltip');

export interface NestedPagePluginState {
  show: boolean;
  counter: number;
  tooltipContentDOM: HTMLElement
}

export function nestedPageSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: false,
      attrs: {
        // This property is used to reference the page
        id: {
          default: null
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-nested-page' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-nested-page' }];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function nestedPagePlugins () {

  const tooltipRenderOpts: SuggestTooltipRenderOpts = {
    placement: 'bottom-start'
  };
  const tooltipDOMSpec = createTooltipDOM();

  return [
    new Plugin<NestedPagePluginState, Schema>({
      key: NestedPagePluginKey,
      state: {
        init () {
          return {
            show: false,
            counter: 0,
            tooltipContentDOM: tooltipDOMSpec.contentDOM
          };
        },
        apply (tr, pluginState) {
          const meta = tr.getMeta(NestedPagePluginKey);
          if (meta === undefined) {
            return pluginState;
          }
          if (meta.type === 'RENDER_TOOLTIP') {
            return {
              ...pluginState,
              show: true
            };
          }
          if (meta.type === 'HIDE_TOOLTIP') {
            // Do not change object reference if show was and is false
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              show: false,
              counter: 0
            };
          }
          if (meta.type === 'INCREMENT_COUNTER') {
            return { ...pluginState, counter: pluginState.counter + 1 };
          }
          if (meta.type === 'RESET_COUNTER') {
            return { ...pluginState, counter: 0 };
          }
          if (meta.type === 'UPDATE_COUNTER') {
            return { ...pluginState, counter: meta.value };
          }
          if (meta.type === 'DECREMENT_COUNTER') {
            return { ...pluginState, counter: pluginState.counter - 1 };
          }
          throw new Error('Unknown type');
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: NestedPagePluginKey,
      renderOpts: {
        ...tooltipRenderOpts,
        tooltipDOMSpec,
        getReferenceElement: referenceElement(NestedPagePluginKey, (state) => {
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
