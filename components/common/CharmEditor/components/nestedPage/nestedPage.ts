import { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec, Plugin, PluginKey } from '@bangle.dev/pm';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import { PageLink } from 'lib/pages';
import { rafCommandExec } from '@bangle.dev/utils/pm-helpers';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';
import { SuggestTooltipPluginState } from '../@bangle.dev/tooltip/suggest-tooltip';

const name = 'page';
export const nestedPageSuggestMarkName = 'nestedPageSuggest';

export interface NestedPagePluginState {
  tooltipContentDOM: HTMLElement
  markName: string
  suggestTooltipKey: PluginKey<SuggestTooltipPluginState>
}

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
  return [{
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
  }, suggestTooltip.spec({ markName: nestedPageSuggestMarkName })];
}

export function nestedPagePlugins ({
  key,
  markName = nestedPageSuggestMarkName,
  tooltipRenderOpts = {}
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
          init () {
            return {
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              suggestTooltipKey
            };
          },
          apply (_, pluginState) {
            return pluginState;
          }
        }
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        onEnter (_, __, view) {
          const selectedMenuItem = document.querySelector('.mention-selected');
          const value = selectedMenuItem?.getAttribute('data-value');

          if (view && value) {
            rafCommandExec(view, (state, dispatch) => {
              const nestedPageNode = state.schema.nodes.page.create({
                id: value
              });
              if (dispatch) {
                dispatch(state.tr.replaceSelectionWith(nestedPageNode));
              }
              return true;
            });
          }
          return false;
        },
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        }
      })
    ];
  };
}
