import {
  bold,
  code,
  italic,
  link,
  paragraph,
  strike,
  underline
} from '@bangle.dev/base-components';
import { Plugin, SpecRegistry } from '@bangle.dev/core';
import type { EditorView } from '@bangle.dev/pm';
import { Node, PluginKey } from '@bangle.dev/pm';
import { useEditorState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import debounce from 'lodash/debounce';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

import { BangleEditor as ReactBangleEditor } from 'components/common/CharmEditor/components/@bangle.dev/react/ReactEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import type { PageContent } from 'models';

import { userDataPlugin } from './components/charm/charm.plugins';
import EmojiSuggest, * as emoji from './components/emojiSuggest';
import * as floatingMenu from './components/floatingMenu';
import Mention, { mentionPlugins, mentionSpecs, MentionSuggest, mentionPluginKeyName } from './components/mention';
import Placeholder from './components/Placeholder';
import * as tabIndent from './components/tabIndent';

export interface ICharmEditorOutput {
  doc: PageContent;
  rawText: string;
}

const emojiPluginKey = new PluginKey(emoji.pluginKeyName);
const mentionPluginKey = new PluginKey(mentionPluginKeyName);
const floatingMenuPluginKey = new PluginKey('floatingMenu');

export const specRegistry = new SpecRegistry([
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
  bold.spec(), // OK
  italic.spec(), // OK
  link.spec(), // OK
  strike.spec(), // OK
  underline.spec(), // OK
  emoji.specs(), // ??
  mentionSpecs(), // NO
  code.spec(), // OK
  tabIndent.spec()
]);

export function charmEditorPlugins (
  {
    onContentChange,
    readOnly,
    userId = null,
    pageId = null,
    spaceId = null
  }:
    {
      readOnly?: boolean; onContentChange?: (view: EditorView) => void;
      spaceId?: string | null;
      pageId?: string | null;
      userId?: string | null;
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
    userDataPlugin({
      userId,
      pageId,
      spaceId
    }),
    bold.plugins(),
    code.plugins(),
    italic.plugins(),
    link.plugins(),
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins(),
    emoji.plugins({
      key: emojiPluginKey
    }),
    mentionPlugins({
      key: mentionPluginKey
    }),
    floatingMenu.plugins({
      key: floatingMenuPluginKey,
      readOnly,
      enableComments: false
    }),
    tabIndent.plugins()
  ];
}

const StyledReactBangleEditor = styled(ReactBangleEditor)<{ noPadding?: boolean }>`
  & {
    padding: ${({ noPadding, theme }) => noPadding ? 0 : theme.spacing(0, 1)};
  }
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
    height: fit-content;
    tab-size: 4;
    caret-color: black;
  }
  pre code {
    color: inherit;
    display: block;
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

export type UpdatePageContent = (content: ICharmEditorOutput) => any;

interface CharmEditorProps {
  content?: PageContent | null;
  children?: ReactNode;
  onContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
  noPadding?: boolean;
  placeholderText?: string;
  focusOnInit?: boolean;
}

export default function CharmEditor (
  { focusOnInit, content, children, onContentChange, style, noPadding, readOnly = false, placeholderText }:
  CharmEditorProps
) {
  const currentSpace = useCurrentSpace();
  const { user } = useUser();

  const _isEmpty = !content || checkIsContentEmpty(content);
  const [isEmpty, setIsEmpty] = useState(_isEmpty);

  const onContentChangeDebounced = onContentChange ? debounce((view: EditorView) => {
    const doc = view.state.doc.toJSON() as PageContent;
    const rawText = view.state.doc.textContent as string;
    onContentChange({ doc, rawText });
  }, 100) : undefined;

  function _onContentChange (view: EditorView) {
    setIsEmpty(checkIsContentEmpty(view.state.doc.toJSON() as PageContent));
    // @ts-ignore missing types from the @bangle.dev/react package
    if (onContentChangeDebounced) {
      onContentChangeDebounced(view);
    }
  }
  let contentJSON = content;
  // for some reason content is saved as a string sometimes.
  if (typeof contentJSON === 'string') {
    try {
      contentJSON = JSON.parse(contentJSON);
    }
    catch (e) {
      // well, we tried
    }
  }

  const initialValue = contentJSON ? Node.fromJSON(specRegistry.schema, contentJSON) : '';

  const state = useEditorState({
    specRegistry,
    plugins: charmEditorPlugins({
      onContentChange: _onContentChange,
      readOnly,
      spaceId: currentSpace?.id,
      userId: user?.id
    }),
    initialValue,
    dropCursorOpts: {
      color: 'transparent'
    }
  });

  return (
    <StyledReactBangleEditor
      focusOnInit={focusOnInit}
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
      className='czi-editor-frame-body'
      noPadding={noPadding}
      pmViewOpts={{
        editable: () => !readOnly,
        plugins: []
      }}
      placeholderComponent={(
        <Placeholder
          sx={{
            fontSize: style?.fontSize,
            zIndex: 20,
            top: noPadding ? 2 : 8,
            left: noPadding ? 0 : 8,
            position: 'absolute'
          }}
          text={placeholderText ?? 'Reply...'}
          show={isEmpty}
        />
      )}
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
      <floatingMenu.FloatingMenu inline pluginKey={floatingMenuPluginKey} />
      <MentionSuggest pluginKey={mentionPluginKey} />
      <EmojiSuggest pluginKey={emojiPluginKey} />
      {children}
    </StyledReactBangleEditor>
  );
}
