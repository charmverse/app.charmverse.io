import PageHeader from 'components/[pageId]/DocumentPage/components/PageHeader';
import CharmEditorComponent from 'components/common/CharmEditor/CharmEditor';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function renderEditorWithContent({ content, title }: { content?: PageContent; title?: string }) {
  return (
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
        title={title || 'Custom page title component'}
        updatedAt={new Date('2021-10-10T10:10:10.000Z').toISOString()}
        readOnly={false}
        setPage={() => {}}
        readOnlyTitle={false}
        focusDocumentEditor={() => null}
      />
    </CharmEditorComponent>
  );
}
