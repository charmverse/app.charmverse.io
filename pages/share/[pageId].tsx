import BlocksEditorPage from 'pages/[domain]/[pageId]';
import { PageContainer } from 'components/common/page-layout/PageLayout';

export default function PublicPage () {

  return (
    <PageContainer>
      <BlocksEditorPage publicShare={true} />
    </PageContainer>
  );
}
