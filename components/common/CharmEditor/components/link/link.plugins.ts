import { link } from '@bangle.dev/base-components';
import type { Mark, PluginKey } from '@bangle.dev/pm';
import { Plugin } from '@bangle.dev/pm';

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
    link.plugins(),
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
          let marks: Mark[] = [];
          view.state.doc.nodesBetween(_pos, _pos, (node) => {
            marks = [...marks, ...node.marks];
          });
          const attrs = marks.find((markItem) => markItem.type.name === markType.name)?.attrs ?? {};
          if (attrs.href) {
            event.stopPropagation();
            window.open(attrs.href, '_blank');
          }
          return false;
        },
        handleDOMEvents: {
          mouseover: (view, event) => {
            function hideWithTimeout() {
              if (tooltipTimer) clearTimeout(tooltipTimer);
              tooltipTimer = setTimeout(() => {
                hideSuggestionsTooltip(key)(view.state, view.dispatch, view);
              }, 750);
            }

            const target = event.target as HTMLAnchorElement; // span for link
            const parentElement = target?.parentElement; // anchor for link
            const hrefElement = parentElement?.classList.contains('charm-link')
              ? parentElement
              : target?.classList.contains('charm-link')
              ? target
              : null;

            if (hrefElement) {
              const href = hrefElement.getAttribute('href');
              if (href) {
                if (tooltipTimer) clearTimeout(tooltipTimer);
                tooltipTimer = setTimeout(() => {
                  renderSuggestionsTooltip(key, {
                    href,
                    ref: hrefElement
                  })(view.state, view.dispatch, view);
                  // hover region in px
                  const BUFFER = 25;
                  hrefElement.onmouseleave = (ev) => {
                    const boundingRect = hrefElement.getBoundingClientRect();
                    const isWithinBufferRegion =
                      ev.clientY > boundingRect.top &&
                      ev.clientY < boundingRect.bottom + BUFFER &&
                      ev.clientX > boundingRect.left &&
                      ev.clientX < boundingRect.right;

                    if (!isWithinBufferRegion) {
                      hideWithTimeout();
                    }
                  };

                  // do not hide when hovering over tooltip
                  tooltipDOMSpec.contentDOM.onmouseenter = () => {
                    if (tooltipTimer) clearTimeout(tooltipTimer);
                  };
                  tooltipDOMSpec.contentDOM.onmouseleave = () => {
                    hideWithTimeout();
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
