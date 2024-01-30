import { useRouter } from 'next/router';
import { useEffect } from 'react';

import getPageLayout from 'components/common/PageLayout/getLayout';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/ProposalPage/NewProposalPage';
import { NewProposalPage } from 'components/proposals/ProposalPage/NewProposalPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCustomJoinSpace } from 'hooks/useCustomJoinSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useUser } from 'hooks/useUser';

export default function PageView() {
  const router = useRouter();
  const isTemplate = router.query.type === 'proposal_template';
  const selectedTemplate = router.query.template as string | undefined;
  const sourcePageId = router.query.sourcePageId as string | undefined;
  const sourcePostId = router.query.sourcePostId as string | undefined;
  const proposalType = router.query.proposalType as ProposalPageAndPropertiesInput['proposalType'];

  const { isSpaceMember } = useIsSpaceMember();

  const { verifyCustomJoin } = useCustomJoinSpace();

  const { isLoaded: isUserLoaded, user } = useUser();
  const { isLoading: isCurrentSpaceLoaded, space } = useCurrentSpace();

  async function tryJoining() {
    await verifyCustomJoin({
      proposalTemplate: selectedTemplate as string
    }).catch(() => router.push(`/join?domain=${encodeURIComponent(space?.domain as string)}`));
  }

  useEffect(() => {
    if (!isSpaceMember && isUserLoaded && !!space) {
      tryJoining().then(() => router.reload());
    }
  }, [isSpaceMember, isUserLoaded, space]);

  if (!isSpaceMember) {
    return null;
  }

  return (
    <NewProposalPage
      proposalType={proposalType}
      templateId={selectedTemplate}
      sourcePageId={sourcePageId}
      sourcePostId={sourcePostId}
      isTemplate={isTemplate}
    />
  );
}

PageView.getLayout = getPageLayout;
