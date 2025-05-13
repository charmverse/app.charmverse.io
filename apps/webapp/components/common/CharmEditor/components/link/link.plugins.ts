import {
  hideSuggestionsTooltip,
  renderSuggestionsTooltip
} from '@packages/bangleeditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import type { Mark } from 'prosemirror-model';
import type { PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';

import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import { referenceElement } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import { plugins as tooltipPlacementPlugins } from '../@bangle.dev/tooltip/tooltipPlacement';

import { getLinkElement } from './getLinkElement';
import { linkPlugins } from './link';

export type LinkPluginState = {
  show: boolean;
  href: string | null;
  tooltipContentDOM: HTMLElement;
  ref?: HTMLElement | null;
  pages: Record<string, string>; // pagePath -> pageId
};

export function plugins({ key, readOnly }: { key: PluginKey; readOnly?: boolean }) {
  const tooltipDOMSpec = createTooltipDOM();
  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  return [
    linkPlugins({ key }),
    new Plugin<LinkPluginState>({
      key,
      state: {
        init() {
          return {
            show: false,
            href: null,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            pages: {}
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
          // update page context
          if (meta.pages) {
            return {
              ...pluginState,
              pages: meta.pages
            };
          }
          throw new Error('Unknown type');
        }
      },
      props: {
        handleClickOn: (view, _pos, _node, _nodePos, event) => {
          // let the default link handling happen for read only mode
          // Otherwise two tabs will open
          if (readOnly) {
            return false;
          }
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
            return true;
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

            const hrefElement = getLinkElement({ htmlElement: event.target as HTMLElement });

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
    tooltipPlacementPlugins({
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
