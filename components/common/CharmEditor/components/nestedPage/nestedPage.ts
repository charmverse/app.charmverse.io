import { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { createTooltipDOM, SuggestTooltipRenderOpts, tooltipPlacement } from '@bangle.dev/tooltip';
import { PageLink } from 'lib/pages';
import { referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';

const name = 'page';

export interface NestedPagePluginState {
  show: boolean;
  counter: number;
  tooltipContentDOM: HTMLElement
}

export const NestedPagePluginKey = new PluginKey<NestedPagePluginState>('suggest_tooltip');

/**
 * Encloses a nested page with markers so it can be parsed after the markdown serialiser has run on the whole document.
 * @param pageId
 */
function encloseNestedPage (pageId: string): string {
  return `_MARKDOWN_NESTED_PAGE(${pageId})_`;
}

/**
 * Returns a list of page IDs
 */
function parseNestedPagesToReplace (convertedToMarkdown: string): string [] {
  return convertedToMarkdown.match(/_MARKDOWN_NESTED_PAGE\((?:[a-f]|\d|-){1,}\)_/g) ?? [];
}

function extractPageId (matchedMarkdownEnclosure: string): string {
  return matchedMarkdownEnclosure
    .trim()
    .split('_MARKDOWN_NESTED_PAGE(')
    .filter(str => !!str)[0]
    .split(')')
    .filter(str => !!str)[0];
}

// function produceLinkMarkdown()

/**
 * Returns markdown content with page data interpolated
 * @param convertedToMarkdown
 */
export async function replaceNestedPages (convertedToMarkdown: string): Promise<string> {

  const nestedPageMarkers = parseNestedPagesToReplace(convertedToMarkdown);

  const isServer = typeof window === 'undefined';
  // Dynamic import allows this function to be loaded in the client-side without triggering a server-side import
  const linkGetter = isServer
  // Server-side method
    ? ((await import('lib/pages/server/generatePageLink')).generatePageLink)
  // Client-side methid
    : (pageId: string) => {

      const documentNode = document.querySelector(`[data-id="page-${pageId}"]`) as HTMLDivElement;
      const pageLink: PageLink = {
        title: documentNode?.getAttribute('data-title') as string ?? '',
        url: documentNode?.getAttribute('data-path') as string ?? ''
      };
      return pageLink;
    };

  await Promise.all(nestedPageMarkers
    .map(pageMarker => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise<void>(async (resolve) => {

        const pageId = extractPageId(pageMarker);

        try {
          const pageLink = await linkGetter(pageId);
          convertedToMarkdown = convertedToMarkdown.replace(pageMarker, `[${pageLink.title}](${pageLink.url})`);
          resolve();
        }
        catch (err) {
          // Lookup failed. Delete this link
          convertedToMarkdown = convertedToMarkdown.replace(pageMarker, '');
          resolve();
        }

      });
    }));
  return convertedToMarkdown;
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
      toMarkdown: (state, node) => {
        try {
          state.write(encloseNestedPage(node.attrs.id));
          state.ensureNewLine();
        }
        catch (err) {
          console.log('Conversion err', err);
        }
      }
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
          // console.log('NESTED', tr);
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
