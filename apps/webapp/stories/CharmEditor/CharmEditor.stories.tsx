import { Divider, Paper } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { contentWithBlocksAndMarks, contentWithMedia } from '@packages/testing/mocks/charmEditorContent';
import { useState } from 'react';
import { Provider } from 'react-redux';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { InlineCharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import CharmEditorComponent from 'components/common/CharmEditor/CharmEditor';
import { mockStateStore } from 'components/common/DatabaseEditor/testUtils';

import { renderEditorWithContent, withCharmEditorProviders } from './renderEditor';

// CharmEditore uses boards state, so we need to mock it
const store = mockStateStore([], {
  boards: {
    boards: []
  }
});

export default {
  title: 'common/CharmEditor/Views',
  component: CharmEditorComponent,
  decorators: [
    withCharmEditorProviders,
    (Story: any) => (
      <Provider store={store}>
        <Paper sx={{ p: 4 }}>
          <PageEditorContainer>
            <Story />
          </PageEditorContainer>
        </Paper>
      </Provider>
    )
  ]
};

export function FullPageEditor() {
  const [content, setContent] = useState<PageContent | undefined>(undefined);
  function onChange(event: ICharmEditorOutput) {
    setContent(event.doc);
  }
  return (
    <>
      <CharmEditorComponent
        allowClickingFooter={true}
        placeholderText='Custom placeholder... start typing / to see commands'
        readOnly={false}
        autoFocus={true}
        pageId='123'
        disablePageSpecificFeatures={false}
        enableSuggestingMode={false}
        enableVoting={true}
        pageType='page'
        pagePermissions={undefined}
        onContentChange={onChange}
        onConnectionEvent={() => {}}
        onParticipantUpdate={() => {}}
        style={{
          minHeight: '100px'
        }}
        disableNestedPages={true}
      />
      <Divider />
      <h3>Document JSON:</h3>
      <pre style={{ fontSize: 10 }}>{JSON.stringify(content, null, 2)}</pre>
    </>
  );
}

export function InlineEditor() {
  return (
    <InlineCharmEditor
      style={{
        paddingTop: 0,
        paddingBottom: 0,
        marginLeft: 8,
        minHeight: 100,
        left: 0
      }}
      focusOnInit={true}
      placeholderText='What are your thought?'
    />
  );
}

export function EditorWithContent() {
  return renderEditorWithContent({ content: contentWithBlocksAndMarks });
}

export function EditorWithMedia() {
  return renderEditorWithContent({ content: contentWithMedia });
}
