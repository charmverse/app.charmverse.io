import {
  bold,
  code,
  italic,
  link,
  paragraph,
  strike,
  underline
} from '@bangle.dev/base-components';
import debounce from 'lodash/debounce';
import { NodeView, Plugin, SpecRegistry } from '@bangle.dev/core';
import { EditorView, Node, PluginKey } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import { CSSProperties, ReactNode, memo } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import { PageContent } from 'models';
import FloatingMenu, { floatingMenuPlugin } from './components/FloatingMenu';
import EmojiSuggest, { plugins as emojiPlugins, specs as emojiSpecs } from './components/emojiSuggest';
import MentionSuggest, { Mention, mentionPlugins, mentionSpecs } from './components/Mention';
import * as tabIndent from './components/tabIndent';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
}

const emojiSuggestPluginKey = new PluginKey('emojiSuggest');
const mentionSuggestPluginKey = new PluginKey('mentionSuggest');
const floatingMenuPluginKey = new PluginKey('floatingMenu');

export const specRegistry = new SpecRegistry([
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
  bold.spec(), // OK
  italic.spec(), // OK
  link.spec(), // OK
  strike.spec(), // OK
  underline.spec(), // OK
  emojiSpecs(), // ??
  mentionSpecs(), // NO
  code.spec(), // OK
  tabIndent.spec()
]);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly
  }:
    {
      readOnly?: boolean, onContentChange?: (view: EditorView) => void
    } = {}
) {
  return () => [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (onContentChange && !view.state.doc.eq(prevState.doc)) {
            onContentChange(view);
          }
        }
      })
    }),
    bold.plugins(),
    code.plugins(),
    italic.plugins(),
    link.plugins(),
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins(),
    emojiPlugins({
      key: emojiSuggestPluginKey
    }),
    mentionPlugins({
      key: mentionSuggestPluginKey
    }),
    floatingMenuPlugin({
      key: floatingMenuPluginKey,
      readOnly
    }),
    NodeView.createPlugin({
      name: 'mention',
      containerDOM: ['span', { class: 'mention-value' }]
    }),
    tabIndent.plugins()
  ];
}

const StyledReactBangleEditor = styled(ReactBangleEditor)`
  .ProseMirror.bangle-editor {
    padding-left: 0px !important;
    width: 100% !important;
  }
  code {
    border-radius: 2px !important;
    background-color: ${({ theme }) => theme.palette.code.background};
    color: ${({ theme }) => theme.palette.code.color};
    display: inline-block;
    font-size: 85%;
    height: 100%;
    tab-size: 4;
    caret-color: black;
  }
  pre code {
    color: inherit;
    display: block;
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

const defaultContent: PageContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph'
    }
  ]
};

export type UpdatePageContent = (content: ICharmEditorOutput) => any;

interface CharmEditorProps {
  content?: PageContent;
  children?: ReactNode;
  onContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
}

function CharmEditor (
  { content = defaultContent, children, onContentChange, style, readOnly = false }:
  CharmEditorProps
) {
  const onContentChangeDebounced = onContentChange ? debounce((view: EditorView) => {
    const doc = view.state.doc.toJSON() as PageContent;
    const rawText = view.state.doc.textContent as string;
    onContentChange({ doc, rawText });
  }, 100) : undefined;

  function _onContentChange (view: EditorView) {
    // @ts-ignore missing types from the @bangle.dev/react package
    if (onContentChangeDebounced) {
      onContentChangeDebounced(view);
    }
  }

  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({
      onContentChange: _onContentChange,
      readOnly
    }),
    initialValue: content ? Node.fromJSON(specRegistry.schema, content) : '',
    // hide the black bar when dragging items - we dont even support dragging most components
    dropCursorOpts: {
      color: 'transparent'
    }
  });

  return (
    <StyledReactBangleEditor
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
      className='czi-editor-frame-body'
      pmViewOpts={{
        editable: () => !readOnly
      }}
      state={state}
      renderNodeViews={({ children: _children, ...props }) => {
        switch (props.node.type.name) {
          case 'mention': {
            return (
              <Mention {...props}>
                {_children}
              </Mention>
            );
          }
          default: {
            return null;
          }
        }
      }}
    >
      <FloatingMenu inline pluginKey={floatingMenuPluginKey} />
      <MentionSuggest pluginKey={mentionSuggestPluginKey} />
      <EmojiSuggest pluginKey={emojiSuggestPluginKey} />
      {children}
    </StyledReactBangleEditor>
  );
}

export default memo((props: CharmEditorProps) => (
  <CharmEditor
    {...props}
  />
));
