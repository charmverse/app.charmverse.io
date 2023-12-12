import { Box } from '@mui/material';
import { useRouter } from 'next/router';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { NewProposalPage } from 'components/proposals/new/NewProposalPage';

export default function PageView() {
  const router = useRouter();
  const isTemplate = router.query.type === 'proposal_template';
  const selectedTemplate = router.query.template as string;

  return (
    <DocumentPageProviders>
      <NewProposalPage templateId={selectedTemplate} isTemplate={isTemplate} />
    </DocumentPageProviders>
  );
}

PageView.getLayout = getPageLayout;
