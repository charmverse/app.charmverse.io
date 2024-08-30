import { bold, code, italic, paragraph, strike, underline } from '@bangle.dev/base-components';
import styled from '@emotion/styled';
import * as tabIndent from '@packages/charmeditor/extensions/tabIndent';
import debounce from 'lodash/debounce';
import { Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { CSSProperties, ReactNode } from 'react';

import { SpecRegistry } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { RawPlugins } from './components/@bangle.dev/core/plugin-loader';
import { BangleEditor as ReactBangleEditor } from './components/@bangle.dev/react/ReactEditor';
import { useEditorState } from './components/@bangle.dev/react/useEditorState';
import { userDataPlugin } from './components/charm/charm.plugins';
import { EmojiPopup } from './components/emojiSuggest/EmojiPopup';
import { pluginKeyName as emojiSuggestKeyName } from './components/emojiSuggest/emojiSuggest.constants';
import { plugins as emojiPlugins } from './components/emojiSuggest/emojiSuggest.plugins';
import * as emoji from './components/emojiSuggest/emojiSuggest.specs';
import FloatingMenu from './components/floatingMenu/FloatingMenu';
import * as floatingMenu from './components/floatingMenu/floatingMenu.plugins';
import { plugins as linkPlugins } from './components/link/link.plugins';
import { spec as linkSpec } from './components/link/link.specs';
import { LinksPopup } from './components/link/LinksPopup';
import { Mention } from './components/mention/components/Mention';
import { MentionsPopup } from './components/mention/components/MentionsPopup';
import { mentionPluginKeyName } from './components/mention/mention.constants';
import { mentionPlugins } from './components/mention/mention.plugins';
import { mentionSpecs } from './components/mention/mention.specs';
import { placeholderPlugin } from './components/placeholder/placeholder';

export interface ICharmEditorOutput {
  doc: PageContent;
  rawText: string;
}

const emojiPluginKey = new PluginKey(emojiSuggestKeyName);
const mentionPluginKey = new PluginKey(mentionPluginKeyName);
const floatingMenuPluginKey = new PluginKey('floatingMenu');
const linksPluginKey = new PluginKey('links');

export const specRegistry = new SpecRegistry([
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
  bold.spec(), // OK
  italic.spec(), // OK
  linkSpec(), // OK
  strike.spec(), // OK
  underline.spec(), // OK
  emoji.specs(), // ??
  mentionSpecs(), // NO
  code.spec(), // OK
  tabIndent.spec
]);

export function charmEditorPlugins({
  onContentChange,
  readOnly,
  userId = null,
  pageId = null,
  spaceId = null,
  placeholderText
}: {
  readOnly?: boolean;
  onContentChange?: (view: EditorView) => void;
  spaceId?: string | null;
  pageId?: string | null;
  userId?: string | null;
  placeholderText?: string;
} = {}): RawPlugins {
  const basePlugins: RawPlugins = [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (!readOnly && onContentChange && !view.state.doc.eq(prevState.doc)) {
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
    linkPlugins({ key: linksPluginKey, readOnly }),
    paragraph.plugins(),
    strike.plugins(),
    underline.plugins(),
    emojiPlugins({
      key: emojiPluginKey
    }),
    mentionPlugins({
      key: mentionPluginKey
    }),
    floatingMenu.plugins({
      key: floatingMenuPluginKey,
      readOnly
    }),
    tabIndent.plugins()
  ];
  if (!readOnly) {
    basePlugins.push(placeholderPlugin(placeholderText));
  }
  return () => basePlugins;
}

const StyledReactBangleEditor = styled(ReactBangleEditor)<{ colorMode?: 'dark'; noPadding?: boolean }>`
  & {
    padding: ${({ noPadding, theme }) => (noPadding ? 0 : theme.spacing(0, 1))};
  }
  .ProseMirror.bangle-editor {
    padding-left: 0px !important;
    width: 100% !important;
    height: 100%;
  }

  ${({ colorMode }) =>
    colorMode === 'dark'
      ? `
          background-color: var(--input-bg);
          border: 1px solid var(--input-border);
          .ProseMirror[data-placeholder]::before {
            color: var(--primary-text);
            opacity: 0.5;
          }`
      : ''};

  code {
    border-radius: 2px !important;
    background-color: ${({ theme }) => theme.palette.code.background};
    color: ${({ theme }) => theme.palette.code.color};
    display: inline-block;
    font-size: 85%;
    height: fit-content;
    tab-size: 4;
    caret-color: var(--primary-text);
  }
  pre code {
    color: inherit;
    display: block;
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

export type UpdatePageContent = (content: ICharmEditorOutput) => any;

interface InlineCharmEditorProps {
  colorMode?: 'dark';
  content?: PageContent | null;
  children?: ReactNode;
  onContentChange?: UpdatePageContent;
  readOnly?: boolean;
  style?: CSSProperties;
  noPadding?: boolean;
  focusOnInit?: boolean;
  placeholderText?: string;
}

export default function CharmEditor({
  colorMode,
  focusOnInit,
  content,
  children,
  onContentChange,
  style,
  noPadding,
  placeholderText,
  readOnly = false
}: InlineCharmEditorProps) {
  const { space: currentSpace } = useCurrentSpace();
  const { user } = useUser();

  const onContentChangeDebounced = onContentChange
    ? debounce((view: EditorView) => {
        const doc = view.state.doc.toJSON() as PageContent;
        const rawText = view.state.doc.textContent as string;
        onContentChange({ doc, rawText });
      }, 100)
    : undefined;

  function _onContentChange(view: EditorView) {
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
    } catch (e) {
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
      userId: user?.id,
      placeholderText: placeholderText ?? 'Reply...'
    }),
    initialValue,
    dropCursorOpts: {
      color: 'transparent'
    }
  });

  return (
    <StyledReactBangleEditor
      colorMode={colorMode}
      focusOnInit={focusOnInit}
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
      inline
      linksPluginKey={linksPluginKey}
      readOnly={readOnly}
      noPadding={noPadding}
      pmViewOpts={{
        editable: () => !readOnly,
        plugins: [],
        attributes: () => ({
          translate: readOnly ? 'yes' : 'no',
          class: 'bangle-editor',
          'data-test': 'charm-editor-input'
        })
      }}
      state={state}
      renderNodeViews={({ children: _children, ...props }) => {
        switch (props.node.type.name) {
          case 'mention': {
            return <Mention {...props}>{_children}</Mention>;
          }
          default: {
            return null;
          }
        }
      }}
    >
      <FloatingMenu inline pluginKey={floatingMenuPluginKey} />
      <MentionsPopup pluginKey={mentionPluginKey} />
      <EmojiPopup pluginKey={emojiPluginKey} />
      {currentSpace && <LinksPopup pluginKey={linksPluginKey} readOnly={readOnly} />}
      {children}
    </StyledReactBangleEditor>
  );
}
