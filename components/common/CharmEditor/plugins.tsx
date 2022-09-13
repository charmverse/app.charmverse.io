import {
  bold,
  bulletList,
  code,
  hardBreak,
  heading,
  horizontalRule,
  italic,
  link,
  listItem,
  orderedList,
  strike,
  underline
} from '@bangle.dev/base-components';
import { NodeView, Plugin, RawPlugins } from '@bangle.dev/core';
import { EditorState, EditorView, Node, PluginKey, Schema } from '@bangle.dev/pm';
import trackPlugin, { commitFromJSON } from '@manuscripts/track-changes';
import * as codeBlock from 'components/common/CharmEditor/components/@bangle.dev/base-components/code-block';
import { plugins as imagePlugins } from 'components/common/CharmEditor/components/@bangle.dev/base-components/image';
import * as callout from './components/callout';
import { userDataPlugin } from './components/charm/charm.plugins';
import * as columnLayout from './components/columnLayout';
import * as disclosure from './components/disclosure';
import * as emoji from './components/emojiSuggest';
import * as floatingMenu from './components/floatingMenu';
import * as inlineComment from './components/inlineComment';
import { plugins as inlinePalettePlugins } from './components/inlinePalette';
import * as inlineVote from './components/inlineVote';
import { mentionPluginKeyName, mentionPlugins } from './components/mention';
import { nestedPagePluginKeyName, nestedPagePlugins } from './components/nestedPage';
import paragraph from './components/paragraph';
import * as rowActions from './components/rowActions';
import * as tabIndent from './components/tabIndent';
import * as table from './components/table';
import * as trailingNode from './components/trailingNode';

export const actionsPluginKey = new PluginKey('row-actions');
export const emojiPluginKey = new PluginKey(emoji.pluginKeyName);
export const mentionPluginKey = new PluginKey(mentionPluginKeyName);
export const floatingMenuPluginKey = new PluginKey('floatingMenu');
export const nestedPagePluginKey = new PluginKey(nestedPagePluginKeyName);
export const inlineCommentPluginKey = new PluginKey(inlineComment.pluginKeyName);
export const inlineVotePluginKey = new PluginKey(inlineVote.pluginKeyName);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly,
    disablePageSpecificFeatures = false,
    enableVoting,
    enableComments = true,
    userId = null,
    pageId = null,
    spaceId = null,
    content = undefined,
    suggestMode = false,
    suggestions = null,
    schema
  }:
    {
      spaceId?: string | null,
      pageId?: string | null,
      userId?: string | null,
      readOnly?: boolean,
      onContentChange?: (view: EditorView, prevDoc: EditorState['doc']) => void,
      disablePageSpecificFeatures?: boolean,
      enableVoting?: boolean,
      enableComments?: boolean,
      content?: Node,
      suggestMode?: boolean,
      suggestions?: any | null,
      schema?: Schema
    } = {}
): () => RawPlugins[] {

  const basePlugins: RawPlugins[] = [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (onContentChange && !view.state.doc.eq(prevState.doc)) {
            onContentChange(view, prevState.doc);
          }
        }
      })
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
    }),
    mentionPlugins({
      key: mentionPluginKey
    }),
    inlinePalettePlugins(),
    bold.plugins(),
    bulletList.plugins(),
    code.plugins(),
    codeBlock.plugins(),
    hardBreak.plugins(),
    heading.plugins(),
    horizontalRule.plugins(),
    italic.plugins(),
    link.plugins(),
    listItem.plugins(),
    orderedList.plugins(),
    columnLayout.plugins(),
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins(),
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
      name: 'iframe',
      containerDOM: ['div', { class: 'iframe-container', draggable: 'false' }]
    }),
    NodeView.createPlugin({
      name: 'quote',
      containerDOM: ['blockquote', { class: 'charm-quote' }],
      contentDOM: ['div']
    }),
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
    trailingNode.plugins(),
    disclosure.plugins()
    // TODO: Pasting iframe or image link shouldn't create those blocks for now
    // iframePlugin,
    // pasteImagePlugin
  ];

  if (!readOnly) {
    basePlugins.push(trackPlugin({
      ancestorDoc: content,
      commit: suggestions && schema ? commitFromJSON(suggestions, schema) : undefined
    }));
    basePlugins.push(rowActions.plugins({
      key: actionsPluginKey
    }));
  }

  if (!disablePageSpecificFeatures) {
    basePlugins.push(inlineComment.plugin({
      key: inlineCommentPluginKey
    }));
    if (enableVoting) {
      basePlugins.push(inlineVote.plugin({
        key: inlineVotePluginKey
      }));
    }
  }

  return () => basePlugins;
}
