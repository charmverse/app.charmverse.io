import { bold, code, hardBreak, italic, strike, underline } from '@bangle.dev/base-components';
import type { RawPlugins } from '@bangle.dev/core';
import { NodeView, Plugin } from '@bangle.dev/core';
import type { EditorState, EditorView } from '@bangle.dev/pm';
import { PluginKey } from '@bangle.dev/pm';
import * as table from '@skiff-org/prosemirror-tables';

import * as codeBlock from './components/@bangle.dev/base-components/code-block';
import { plugins as imagePlugins } from './components/@bangle.dev/base-components/image';
import { plugins as bookmarkPlugins } from './components/bookmark/bookmarkPlugins';
import * as bulletList from './components/bulletList';
import * as callout from './components/callout/callout';
import { userDataPlugin } from './components/charm/charm.plugins';
import * as columnLayout from './components/columnLayout/columnLayout.plugins';
import * as disclosure from './components/disclosure';
import { pluginKeyName as emojiSuggestKeyName } from './components/emojiSuggest/emojiSuggest.constants';
import * as emoji from './components/emojiSuggest/emojiSuggest.plugins';
import { rejectAll } from './components/fiduswriter/track/rejectAll';
import { plugins as filePlugins } from './components/file/file.plugins';
import * as floatingMenu from './components/floatingMenu';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe';
import * as inlineComment from './components/inlineComment';
import { plugins as inlinePalettePlugins } from './components/inlinePalette/inlinePalette';
import * as inlineVote from './components/inlineVote';
import { plugins as linkPlugins } from './components/link/link.plugins';
import * as listItem from './components/listItem/listItem';
import { plugins as markdownPlugins } from './components/markdown/markdown.plugins';
import { mentionPluginKeyName, mentionPlugins } from './components/mention';
import { nestedPagePluginKeyName, nestedPagePlugins } from './components/nestedPage';
import * as nft from './components/nft/nft.plugins';
import * as orderedList from './components/orderedList';
import paragraph from './components/paragraph';
import * as pasteChecker from './components/pasteChecker/pasteChecker';
import { placeholderPlugin } from './components/placeholder/index';
import * as rowActions from './components/rowActions/rowActions';
import { plugins as trackPlugins } from './components/suggestions/suggestions.plugins';
import * as tabIndent from './components/tabIndent';
import { plugins as tableOfContentPlugins } from './components/tableOfContents/tableOfContents.plugins';
import * as trailingNode from './components/trailingNode';
import * as tweet from './components/tweet/tweet';
import { plugins as videoPlugins } from './components/video/video';

export const actionsPluginKey = new PluginKey('row-actions');
export const emojiPluginKey = new PluginKey(emojiSuggestKeyName);
export const mentionPluginKey = new PluginKey(mentionPluginKeyName);
export const floatingMenuPluginKey = new PluginKey('floatingMenu');
export const nestedPagePluginKey = new PluginKey(nestedPagePluginKeyName);
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
    // this trackPlugin should be called before the one below which calls onSelectionSet().
    // TODO: find a cleaner way to combine this logic?
    trackPlugins({ onSelectionSet, key: suggestionsPluginKey }),
    linkPlugins({ key: linksPluginKey }),
    pasteChecker.plugins({ onError }),
    new Plugin({
      view: (_view) => {
        if (readOnly) {
          rejectAll(_view);
        }
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
    nestedPagePlugins({
      key: nestedPagePluginKey
    }),
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
    bulletList.plugins(),
    code.plugins(),
    codeBlock.plugins(),
    hardBreak.plugins(),
    heading.plugins(),
    horizontalRule.plugins(),
    italic.plugins(),
    listItem.plugins({
      readOnly
    }),
    orderedList.plugins(),
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
    tabIndent.plugins(),
    table.tableEditing({ allowTableNodeSelection: true }),
    table.columnHandles(),
    table.columnResizing({}),
    // @ts-ignore missing type
    table.tablePopUpMenu(),
    // @ts-ignore missing type
    table.tableHeadersMenu(),
    // @ts-ignore missing type
    table.selectionShadowPlugin(),
    // @ts-ignore missing type
    table.TableFiltersMenu(),
    disclosure.plugins(),
    nft.plugins(),
    tweet.plugins(),
    trailingNode.plugins(),
    videoPlugins(),
    iframe.plugins(),
    markdownPlugins(),
    tableOfContentPlugins(),
    filePlugins(),
    placeholderPlugin(placeholderText)
  );

  if (!readOnly && !disableRowHandles) {
    basePlugins.push(
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
