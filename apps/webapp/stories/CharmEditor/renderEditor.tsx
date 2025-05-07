import type { PageContent } from '@packages/charmeditor/interfaces';

import PageHeader from 'components/[pageId]/DocumentPage/components/PageHeader';
import CharmEditorComponent from 'components/common/CharmEditor/CharmEditor';
import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { CharmEditorViewProvider } from 'hooks/useCharmEditorView';
import { ThreadsProvider } from 'hooks/useThreads';

export function CharmEditorStorybookProviders({ children }: { children: React.ReactNode }) {
  return (
    <CharmEditorViewProvider>
      <ThreadsProvider>
        <CharmEditorProvider>{children}</CharmEditorProvider>
      </ThreadsProvider>
    </CharmEditorViewProvider>
  );
}

export function renderEditorWithContent({ content, title }: { content?: PageContent; title?: string }) {
  return (
    <CharmEditorStorybookProviders>
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
        onParticipantUpdate={() => {}}
        style={{
          minHeight: '100px'
        }}
        disableNestedPages={true}
        content={content}
        isContentControlled={true}
      />
    </CharmEditorStorybookProviders>
  );
}

export const withCharmEditorProviders = (Story: any) => {
  return (
    <CharmEditorStorybookProviders>
      <Story />
    </CharmEditorStorybookProviders>
  );
};
