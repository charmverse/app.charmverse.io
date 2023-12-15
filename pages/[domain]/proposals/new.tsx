import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { NewProposalPage } from 'components/proposals/ProposalPage/NewProposalPage';

export default function PageView() {
  const router = useRouter();
  const isTemplate = router.query.type === 'proposal_template';
  const selectedTemplate = router.query.template as string;
  return <NewProposalPage templateId={selectedTemplate} isTemplate={isTemplate} />;
}

PageView.getLayout = getPageLayout;
