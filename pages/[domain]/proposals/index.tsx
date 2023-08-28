import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { setTitle } from 'hooks/usePageTitle';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

export default function ProposalsPageComponent() {
  setTitle('Proposals');

  return (
    <ProposalBlocksProvider>
      <ProposalsPage />;
    </ProposalBlocksProvider>
  );
}

ProposalsPageComponent.getLayout = getPageLayout;
