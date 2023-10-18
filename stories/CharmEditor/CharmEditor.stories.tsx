import { Divider, Paper } from '@mui/material';
import { useState } from 'react';
import { Provider } from 'react-redux';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import CharmEditorComponent from 'components/common/CharmEditor/CharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { contentWithBlocksAndMarks, contentWithMedia } from 'testing/mocks/charmEditorContent';

import { renderEditorWithContent } from './renderEditor';

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
    (Story: any) => (
      <Provider store={store}>
        <Paper sx={{ p: 4 }}>
          <Container>
            <Story />
          </Container>
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
        PageSidebar={null}
        pageId='123'
        disablePageSpecificFeatures={false}
        enableSuggestingMode={false}
        enableVoting={true}
        pageType='page'
        pagePermissions={undefined}
        onContentChange={onChange}
        onConnectionEvent={() => {}}
        snapshotProposalId={null}
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
