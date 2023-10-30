import { bold, code, hardBreak, italic, strike, underline } from '@bangle.dev/base-components';
import type { RawPlugins } from '@bangle.dev/core';
import { NodeView, Plugin } from '@bangle.dev/core';
import type { EditorState, EditorView } from '@bangle.dev/pm';
import { PluginKey, TextSelection } from '@bangle.dev/pm';
import type { PageType } from '@charmverse/core/prisma-client';

import { emitSocketMessage } from 'hooks/useWebSocketClient';

import * as codeBlock from './components/@bangle.dev/base-components/code-block';
import { plugins as imagePlugins } from './components/@bangle.dev/base-components/image';
import { plugins as bookmarkPlugins } from './components/bookmark/bookmarkPlugins';
import * as callout from './components/callout/callout';
import { userDataPlugin } from './components/charm/charm.plugins';
import * as columnLayout from './components/columnLayout/columnLayout.plugins';
import * as disclosure from './components/disclosure';
import { pluginKeyName as emojiSuggestKeyName } from './components/emojiSuggest/emojiSuggest.constants';
import * as emoji from './components/emojiSuggest/emojiSuggest.plugins';
import { plugins as filePlugins } from './components/file/file.plugins';
import * as floatingMenu from './components/floatingMenu';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe';
import * as inlineComment from './components/inlineComment';
import { plugins as inlinePalettePlugins } from './components/inlinePalette/inlinePalette';
import * as inlineVote from './components/inlineVote';
import { plugins as linkPlugins } from './components/link/link.plugins';
import { linkedPagePluginKeyName } from './components/linkedPage/linkedPage.constants';
import { linkedPagePlugins } from './components/linkedPage/linkedPage.plugins';
import * as listItem from './components/listItem/listItem';
import { plugins as listPlugins } from './components/listItemNew/listItemPlugins';
import { plugins as markdownPlugins } from './components/markdown/markdown.plugins';
import { mentionPluginKeyName, mentionPlugins } from './components/mention';
import { nestedPagePlugins } from './components/nestedPage';
import * as nft from './components/nft/nft.plugins';
import paragraph from './components/paragraph';
import * as pasteChecker from './components/pasteChecker/pasteChecker';
import { placeholderPlugin } from './components/placeholder/placeholder';
import { dragPluginKey } from './components/prosemirror/prosemirror-dropcursor/dropcursor';
import * as rowActions from './components/rowActions/rowActions';
import { plugins as trackPlugins } from './components/suggestions/suggestions.plugins';
import * as tabIndent from './components/tabIndent';
import { plugins as tablePlugins } from './components/table/table.plugins';
import { plugins as tableOfContentPlugins } from './components/tableOfContents/tableOfContents.plugins';
import * as trailingNode from './components/trailingNode';
import * as tweet from './components/tweet/tweet';
import { plugins as videoPlugins } from './components/video/video';

export const actionsPluginKey = new PluginKey('row-actions');
export const emojiPluginKey = new PluginKey(emojiSuggestKeyName);
export const mentionPluginKey = new PluginKey(mentionPluginKeyName);
export const floatingMenuPluginKey = new PluginKey('floatingMenu');
export const linkedPagePluginKey = new PluginKey(linkedPagePluginKeyName);
export const inlineCommentPluginKey = new PluginKey(inlineComment.pluginKeyName);
export const linksPluginKey = new PluginKey('links');
export const inlinePalettePluginKey = new PluginKey('inlinePalette');
const columnsPluginKey = new PluginKey('columns');
const inlineVotePluginKey = new PluginKey(inlineVote.pluginKeyName);

export const suggestionsPluginKey = new PluginKey('suggestions');

export function charmEditorPlugins({
  onContentChange,
  onError = () => {},
  onSelectionSet,
  readOnly = false,
  disablePageSpecificFeatures = false,
  enableVoting,
  enableComments = true,
  userId = null,
  pageId = null,
  spaceId = null,
  placeholderText,
  disableRowHandles = false,
  disableMention = false
}: {
  disableMention?: boolean;
  disableRowHandles?: boolean;
  spaceId?: string | null;
  pageId?: string | null;
  userId?: string | null;
  readOnly?: boolean;
  onContentChange?: (view: EditorView, prevDoc: EditorState['doc']) => void;
  onSelectionSet?: (state: EditorState) => void;
  onError?: (error: Error) => void;
  disablePageSpecificFeatures?: boolean;
  enableVoting?: boolean;
  enableComments?: boolean;
  placeholderText?: string;
} = {}): () => RawPlugins[] {
  const basePlugins: RawPlugins[] = [
    new Plugin({
      key: dragPluginKey,
      state: {
        init: () => {
          return {
            hoveredDomNode: null
          };
        },
        apply: (tr, pluginState: { hoveredDomNode: Element | null }) => {
          const newPluginState = tr.getMeta(dragPluginKey);
          if (newPluginState) {
            return { ...pluginState, ...newPluginState };
          }
          return pluginState;
        }
      },
      props: {
        handleDOMEvents: {
          drop(view, ev) {
            if (!ev.dataTransfer || !pageId) {
              return false;
            }

            const sidebarPageData = ev.dataTransfer.getData('sidebar-page');

            const hoveredDomNode = dragPluginKey.getState(view.state).hoveredDomNode as Element;
            const hoveredPageId = hoveredDomNode?.getAttribute('data-id')?.split('page-')[1];

            view.dispatch(view.state.tr.setMeta(dragPluginKey, { hoveredDomNode: null }));
            hoveredDomNode.classList.remove('Prosemirror-hovered-page-node');
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 0)));

            if (sidebarPageData) {
              const coordinates = view.posAtCoords({
                left: ev.clientX,
                top: ev.clientY
              });

              if (!coordinates) {
                return false;
              }

              try {
                const parsedData = JSON.parse(sidebarPageData) as { pageId: string | null; pageType: PageType };
                if (!parsedData.pageId) {
                  return false;
                }
                ev.preventDefault();
                emitSocketMessage({
                  type: 'page_reordered_sidebar_to_editor',
                  payload: {
                    pageId: parsedData.pageId,
                    newParentId: hoveredPageId ?? pageId,
                    newIndex: -1,
                    dropPos: hoveredPageId ? null : coordinates.pos + (view.state.doc.nodeAt(coordinates.pos) ? 0 : 1)
                  }
                });
                // + 1 for dropping in non empty node
                // + 0 for dropping in empty node (blank line)
                return false;
              } catch (_) {
                return false;
              }
            } else if (hoveredDomNode) {
              const draggedNode = view.state.doc.nodeAt(view.state.selection.$anchor.pos);

              if (!draggedNode || hoveredDomNode.getAttribute('data-page-type') !== 'page') {
                return false;
              }

              const draggedPageId = draggedNode.attrs.id;

              if (!hoveredPageId || hoveredPageId === draggedPageId) {
                return false;
              }

              ev.preventDefault();
              emitSocketMessage({
                type: 'page_reordered_editor_to_editor',
                payload: {
                  pageId: draggedPageId,
                  newParentId: hoveredPageId,
                  newIndex: -1,
                  draggedNode: draggedNode.toJSON(),
                  dragNodePos: view.state.selection.$anchor.pos,
                  currentParentId: pageId
                }
              });
              return false;
            }

            return false;
          }
        }
      }
    }),
    // this trackPlugin should be called before the one below which calls onSelectionSet().
    // TODO: find a cleaner way to combine this logic?
    trackPlugins({ onSelectionSet, key: suggestionsPluginKey }),
    linkPlugins({ key: linksPluginKey }),
    pasteChecker.plugins({ onError }),
    new Plugin({
      view: () => {
        return {
          update: (view, prevState) => {
            if (
              // Update only if page is in editing mode or in viewing mode
              (!readOnly || enableComments || enableVoting) &&
              onContentChange &&
              !view.state.doc.eq(prevState.doc)
            ) {
              onContentChange(view, prevState.doc);
            }
          }
        };
      }
    }),
    userDataPlugin({
      userId,
      pageId,
      spaceId
    }),
    linkedPagePlugins({
      key: linkedPagePluginKey
    }),
    nestedPagePlugins(),
    imagePlugins({
      handleDragAndDrop: false
    })
  ];

  // Breaking the array in order to make sure the plugins order is correct

  if (!disableMention) {
    basePlugins.push(
      mentionPlugins({
        key: mentionPluginKey
      })
    );
  }

  basePlugins.push(
    inlinePalettePlugins({ key: inlinePalettePluginKey }),
    bold.plugins(),
    code.plugins(),
    codeBlock.plugins(),
    hardBreak.plugins(),
    heading.plugins(),
    horizontalRule.plugins(),
    italic.plugins(),
    listItem.plugins({
      readOnly
    }),
    // bulletList.plugins(),
    // orderedList.plugins(),
    listPlugins({ readOnly }),
    columnLayout.plugins({
      key: columnsPluginKey,
      readOnly
    }),
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins() as RawPlugins,
    emoji.plugins({
      key: emojiPluginKey
    }),
    floatingMenu.plugins({
      key: floatingMenuPluginKey,
      readOnly,
      enableComments
    }),
    callout.plugins(),
    NodeView.createPlugin({
      name: 'image',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'horizontalRule',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'pdf',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'cryptoPrice',
      containerDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'quote',
      containerDOM: ['blockquote', { class: 'charm-quote' }],
      contentDOM: ['div']
    }),
    NodeView.createPlugin({
      name: 'inlineDatabase',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'poll',
      containerDOM: ['div', { draggable: 'false' }]
    }),
    bookmarkPlugins(),
    tablePlugins,
    disclosure.plugins(),
    nft.plugins(),
    tweet.plugins(),
    trailingNode.plugins(),
    videoPlugins(),
    iframe.plugins(),
    markdownPlugins(),
    tableOfContentPlugins(),
    filePlugins(),
    placeholderPlugin(placeholderText),
    tabIndent.plugins() // tabIndent should be triggered last so other plugins can override the keymap
  );

  if (!readOnly && !disableRowHandles) {
    // add rowActions before the table plugin, or else mousedown is not triggered
    basePlugins.unshift(
      rowActions.plugins({
        key: actionsPluginKey
      })
    );
  }

  if (!disablePageSpecificFeatures) {
    basePlugins.push(
      inlineComment.plugin({
        key: inlineCommentPluginKey
      })
    );
    if (enableVoting) {
      basePlugins.push(
        inlineVote.plugin({
          key: inlineVotePluginKey
        })
      );
    }
  }

  return () => {
    return basePlugins;
  };
}
