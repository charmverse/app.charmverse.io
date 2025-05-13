import { useGetPage } from 'charmClient/hooks/pages';
import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import ShareToWeb from '../common/ShareToWeb';

type Props = {
  pageId: string;
};

export default function FreeShareToWeb({ pageId }: Props) {
  const { data: currentPage } = useGetPage(pageId);
  const { data: proposal } = useGetProposalDetails(currentPage?.proposalId);

  const { getFeatureTitle } = useSpaceFeatures();

  const proposalsLabel = getFeatureTitle('proposals');

  const shareAlertMessage =
    currentPage?.type === 'proposal' && proposal?.status === 'draft'
      ? 'This draft is only visible to authors and reviewers until it is published.'
      : currentPage?.type === 'proposal' && proposal?.status !== 'draft'
        ? `Published ${proposalsLabel}  are publicly visible.`
        : null;

  const isChecked =
    // If space has public proposals, don't interfere with non-proposal pages
    currentPage?.type !== 'proposal' ||
    // All proposals beyond draft are public
    (currentPage?.type === 'proposal' && proposal?.status !== 'draft');

  return (
    <ShareToWeb
      disabled
      pageId={pageId}
      shareChecked={isChecked}
      discoveryChecked={false}
      shareAlertMessage={shareAlertMessage}
      pageType={currentPage?.type}
    />
  );
}
