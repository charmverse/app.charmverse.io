import type { PluginKey } from '@bangle.dev/pm';
import { Plugin } from '@bangle.dev/pm';
import { getMarkAttrs } from '@bangle.dev/utils';

import { createTooltipDOM, tooltipPlacement } from '../@bangle.dev/tooltip';
import {
  hideSuggestionsTooltip,
  referenceElement,
  renderSuggestionsTooltip
} from '../@bangle.dev/tooltip/suggest-tooltip';

export type LinkPluginState = {
  show: boolean;
  href: string | null;
  tooltipContentDOM: HTMLElement;
  ref?: HTMLElement | null;
};

export function plugins({ key }: { key: PluginKey }) {
  const tooltipDOMSpec = createTooltipDOM();

  let tooltipTimer: null | NodeJS.Timer = null;

  return [
    new Plugin<LinkPluginState>({
      key,
      state: {
        init() {
          return {
            show: false,
            href: null,
            tooltipContentDOM: tooltipDOMSpec.contentDOM
          };
        },
        apply(tr, pluginState) {
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
              href: null,
              ref: null,
              show: false
            };
          }
          throw new Error('Unknown type');
        }
      },
      props: {
        handleClick: (view, _pos, event) => {
          const { schema } = view.state;
          const markType = schema.marks.link;
          const attrs = getMarkAttrs(view.state, markType);
          if (attrs.href) {
            event.stopPropagation();
            window.open(attrs.href);
          }
          return false;
        },
        handleDOMEvents: {
          mouseover: (view, event) => {
            const target = event.target as HTMLAnchorElement; // span for link
            const parentElement = target?.parentElement; // anchor for link
            if (parentElement) {
              const isCharmLink = parentElement.classList.contains('charm-link');
              const href = parentElement.getAttribute('href');
              if (href && isCharmLink) {
                if (tooltipTimer) clearTimeout(tooltipTimer);
                tooltipTimer = setTimeout(() => {
                  renderSuggestionsTooltip(key, {
                    href,
                    ref: parentElement
                  })(view.state, view.dispatch, view);
                  // hover region in px
                  const BUFFER = 25;
                  parentElement.onmouseleave = (ev) => {
                    const boundingRect = parentElement.getBoundingClientRect();
                    const isWithinBufferRegion =
                      ev.clientY > boundingRect.top &&
                      ev.clientY < boundingRect.bottom + BUFFER &&
                      ev.clientX > boundingRect.left &&
                      ev.clientX < boundingRect.right;
                    if (!isWithinBufferRegion) {
                      if (tooltipTimer) clearTimeout(tooltipTimer);
                      tooltipTimer = setTimeout(() => {
                        hideSuggestionsTooltip(key)(view.state, view.dispatch, view);
                      }, 700);
                    }
                  };
                }, 400);
              }
            }
            return false;
          }
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: key,
      renderOpts: {
        placement: 'bottom-start',
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
