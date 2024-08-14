import { paragraph } from '@bangle.dev/base-components';
import styled from '@emotion/styled';
import { SpecRegistry } from '@root/components/common/CharmEditor/components/@bangle.dev/core/specRegistry';
import type { BaseRawNodeSpec } from '@root/components/common/CharmEditor/components/@bangle.dev/core/specRegistry';
import { useEditorState } from '@root/components/common/CharmEditor/components/@bangle.dev/react/useEditorState';
import * as tabIndent from '@root/components/common/CharmEditor/components/tabIndent';
import type { PageContent } from '@root/lib/prosemirror/interfaces';
import debounce from 'lodash/debounce';
import { Node } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { CSSProperties, ReactNode } from 'react';

import { ReactBangleEditor } from './ReactEditor';

export interface ICharmEditorOutput {
  doc: PageContent;
  rawText: string;
}

const name = 'doc';

function docSpec({ content = 'block+' } = {}): BaseRawNodeSpec {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content
    }
  };
}

export const specRegistry = new SpecRegistry([docSpec(), paragraph.spec(), tabIndent.spec()]);

function charmEditorPlugins({
  onContentChange,
  readOnly,
  placeholderText
}: {
  readOnly?: boolean;
  onContentChange?: (view: EditorView) => void;
  placeholderText?: string;
} = {}) {
  const basePlugins = [
    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          if (!readOnly && onContentChange && !view.state.doc.eq(prevState.doc)) {
            onContentChange(view);
          }
        }
      })
    }),
    paragraph.plugins(),
    tabIndent.plugins()
  ];
  return () => basePlugins;
}

const StyledReactBangleEditor = styled(ReactBangleEditor)<{ colorMode?: 'dark'; noPadding?: boolean }>`
  & {
    padding: 8px;
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
`;

export type UpdatePageContent = (content: ICharmEditorOutput) => any;

interface MinimalCharmEditorProps {
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

export default function MinimalCharmEditor({
  colorMode,
  focusOnInit,
  content,
  children,
  onContentChange,
  style,
  noPadding,
  placeholderText,
  readOnly = false
}: MinimalCharmEditorProps) {
  const onContentChangeDebounced = onContentChange
    ? debounce((view: EditorView) => {
        onContentChange({ doc: view.state.doc.toJSON() as PageContent, rawText: view.state.doc.textContent as string });
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
      readOnly={readOnly}
      noPadding={noPadding}
      style={{
        ...(style ?? {}),
        width: '100%',
        height: '100%'
      }}
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
    >
      {children}
    </StyledReactBangleEditor>
  );
}