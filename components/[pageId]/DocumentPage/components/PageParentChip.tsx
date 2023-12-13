import { Chip, Link } from '@mui/material';
import { useMemo } from 'react';

import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { usePages } from 'hooks/usePages';

type Props = {
  pageId: string;
  parentId?: string | null;
  insideModal?: boolean;
};

export function PageParentChip({ pageId, parentId, insideModal }: Props) {
  const { pages } = usePages();
  const { getRewardById } = useRewards();
  const {
    router: { query },
    updateURLQuery
  } = useCharmRouter();

  const page = pages[pageId];
  const parentPage = parentId ? pages[parentId] : null;

  const parentProposalId = page?.type === 'bounty' && page.bountyId && getRewardById(page.bountyId)?.proposalId;
  const parentProposal = parentProposalId ? pages[parentProposalId] : undefined;

  const title = parentPage?.title || parentProposal?.title || 'Untitled';
  const href = parentPage?.path || parentProposal?.path || '/';

  const backLinkModalType = useMemo(() => {
    if (!page?.type || !query.id) {
      return;
    }

    if (page.type === 'bounty' && query.rewardId) {
      return 'rewardToProposal';
    }

    // other types in the future
  }, [page?.type, query.id, query.rewardId]);

  if (!parentPage && !parentProposal) {
    return null;
  }

  // full page redirect
  if (!insideModal || !backLinkModalType) {
    return (
      <Chip
        label={title}
        sx={{
          cursor: 'pointer'
        }}
        size='small'
        component={Link}
        href={href}
      />
    );
  }

  const goBack = () => {
    switch (backLinkModalType) {
      case 'rewardToProposal':
        updateURLQuery({ rewardId: null });
        break;
      default:
        break;
    }
  };

  // close modal
  return (
    <Chip
      label={parentProposal?.title || 'Untitled'}
      sx={{
        cursor: 'pointer'
      }}
      size='small'
      component={Link}
      onClick={goBack}
    />
  );
}
