import { bold, code, italic, strike, underline } from '@bangle.dev/base-components';
import * as codeBlock from '@packages/bangleeditor/components/@bangle.dev/base-components/code-block';
import { pluginKeyName as emojiSuggestKeyName } from '@packages/bangleeditor/components/emojiSuggest/emojiSuggest.constants';
import { linkedPagePluginKeyName } from '@packages/bangleeditor/components/linkedPage/linkedPage.constants';
import * as hardBreak from '@packages/charmeditor/extensions/hardBreak';
import { plugins as listPlugins } from '@packages/charmeditor/extensions/listItem';
import * as tabIndent from '@packages/charmeditor/extensions/tabIndent';
import type { EditorState } from 'prosemirror-state';
import { PluginKey, Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';

import { plugins as imagePlugins } from './components/@bangle.dev/base-components/image';
import { plugins as bookmarkPlugins } from './components/bookmark/bookmarkPlugins';
import * as button from './components/button/button.plugins';
import * as callout from './components/callout/callout';
import { userDataPlugin } from './components/charm/charm.plugins';
import * as columnLayout from './components/columnLayout/columnLayout.plugins';
import * as disclosure from './components/disclosure';
import * as emoji from './components/emojiSuggest/emojiSuggest.plugins';
import { plugins as filePlugins } from './components/file/file.plugins';
import * as floatingMenu from './components/floatingMenu/floatingMenu.plugins';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe';
import * as inlineComment from './components/inlineComment';
import { plugins as inlinePalettePlugins } from './components/inlinePalette/inlinePalettePlugin';
import * as inlineVote from './components/inlineVote';
import { plugins as linkPlugins } from './components/link/link.plugins';
import { linkedPagePlugins } from './components/linkedPage/linkedPage.plugins';
import * as listItem from './components/listItem/listItem';
import { plugins as markdownPlugins } from './components/markdown/markdown.plugins';
import { mentionPluginKeyName, mentionPlugins } from './components/mention';
import { nestedPagePlugins, pageNodeDropPlugin } from './components/nestedPage/nestedPage.plugins';
import * as nft from './components/nft/nft.plugins';
import { plugins as paragraphPlugins } from './components/paragraph/paragraph';
import * as pasteChecker from './components/pasteChecker/pasteChecker';
import { placeholderPlugin } from './components/placeholder/placeholder';
import { plugins as quotePlugins } from './components/quote/quote';
import * as rowActions from './components/rowActions/rowActions';
import { plugins as trackPlugins } from './components/suggestions/suggestions.plugins';
// import { plugins as tablePlugins } from './components/table/table.plugins';
import { plugins as tablePlugins } from './components/table/table.plugins';
import { plugins as tableOfContentPlugins } from './components/tableOfContents/tableOfContents.plugins';
import { plugins as threadPlugins } from './components/thread/thread.plugins';
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
  disableMention = false,
  threadIds,
  disableVideo = false
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
  threadIds?: string[];
  disableVideo?: boolean;
} = {}): () => RawPlugins[] {
  const basePlugins: RawPlugins[] = [
    pageNodeDropPlugin({
      pageId
    }),
    // this trackPlugin should be called before the one below which calls onSelectionSet().
    // TODO: find a cleaner way to combine this logic?
    trackPlugins({ onSelectionSet, key: suggestionsPluginKey }),
    linkPlugins({ key: linksPluginKey, readOnly }),
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
    imagePlugins()
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
    paragraphPlugins(),
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
      name: 'farcasterFrame',
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
    button.plugins(),
    tweet.plugins(),
    trailingNode.plugins(),
    iframe.plugins(),
    markdownPlugins(),
    tableOfContentPlugins(),
    filePlugins(),
    placeholderPlugin(placeholderText),
    quotePlugins(),
    tabIndent.plugins() // tabIndent should be triggered last so other plugins can override the keymap
  );

  if (threadIds) {
    basePlugins.push(
      threadPlugins({
        threadIds
      })
    );
  }

  if (!disableVideo) {
    basePlugins.push(videoPlugins());
  }

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
