import { Paper } from '@mui/material';
import { Provider } from 'react-redux';

import PageHeader from 'components/[pageId]/DocumentPage/components/PageHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import CharmEditorComponent from 'components/common/CharmEditor/CharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';
import {
  contentWithBlocksAndMarks,
  contentWithColumnsAndTables,
  contentWithMedia
} from 'testing/mocks/charmEditorContent';

function renderEditorWithContent(content: PageContent | undefined) {
  return (
    <CharmEditorComponent
      placeholderText='Custom placeholder... start typing / to see commands'
      readOnly={false}
      autoFocus={true}
      pageActionDisplay={null}
      pageId='123'
      disablePageSpecificFeatures={false}
      enableSuggestingMode={false}
      enableVoting={true}
      pageType='page'
      pagePermissions={undefined}
      onConnectionEvent={() => {}}
      snapshotProposalId={null}
      onParticipantUpdate={() => {}}
      style={{
        minHeight: '100px'
      }}
      disableNestedPages={true}
      content={content}
      isContentControlled={true}
    >
      <PageHeader
        headerImage=''
        icon=''
        title='Custom page title component'
        updatedAt={new Date('2021-10-10T10:10:10.000Z').toISOString()}
        readOnly={false}
        setPage={() => {}}
        readOnlyTitle={false}
      />
    </CharmEditorComponent>
  );
}

// CharmEditore uses boards state, so we need to mock it
const store = mockStateStore([], {
  boards: {
    boards: []
  }
});

export default {
  title: 'common/CharmEditor',
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
  return (
    <CharmEditorComponent
      placeholderText='Custom placeholder... start typing / to see commands'
      readOnly={false}
      autoFocus={true}
      pageActionDisplay={null}
      pageId='123'
      disablePageSpecificFeatures={false}
      enableSuggestingMode={false}
      enableVoting={true}
      pageType='page'
      pagePermissions={undefined}
      onConnectionEvent={() => {}}
      snapshotProposalId={null}
      onParticipantUpdate={() => {}}
      style={{
        minHeight: '100px'
      }}
      disableNestedPages={true}
    />
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
  return renderEditorWithContent(contentWithBlocksAndMarks);
}

export function ColumnLayout() {
  return renderEditorWithContent(contentWithColumnsAndTables);
}

export function EditorWithMedia() {
  return renderEditorWithContent(contentWithMedia);
}
