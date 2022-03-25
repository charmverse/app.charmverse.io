import BlocksEditorPage from 'pages/[domain]/[pageId]';
import PageContainer from 'components/common/PageLayout/components/PageContainer';

export default function PublicPage () {

  return (
    <PageContainer>
      <BlocksEditorPage publicShare={true} />
    </PageContainer>
  );
}
