import { Box } from '@mui/material';
import { useMemo } from 'react';

import { useGetPageMeta } from 'charmClient/hooks/pages';
import Link from 'components/common/Link';
import { BreadcrumbPageTitle } from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { usePages } from 'hooks/usePages';

type Props = {
  pageId?: string;
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

  const page = pageId ? pages[pageId] : null;
  const parentPage = parentId ? pages[parentId] : null;

  const parentProposalId =
    (page?.type === 'bounty' && page.bountyId && getRewardById(page.bountyId)?.proposalId) || undefined;
  const { data: parentProposal } = useGetPageMeta(parentProposalId);

  const title = parentPage?.title || parentProposal?.title || 'Untitled';
  const path = parentPage?.path || parentProposal?.path || '/';
  const href = path ? `/${path}` : '/';

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
      <Box sx={{ a: { color: 'inherit' } }}>
        <Link href={href}>
          <BreadcrumbPageTitle sx={{ maxWidth: 160 }}>{title}</BreadcrumbPageTitle>
        </Link>
      </Box>
    );
  }

  const goBack = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault();

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
    <Box sx={{ a: { color: 'inherit' } }}>
      <Link href={href} onClick={goBack}>
        <BreadcrumbPageTitle sx={{ maxWidth: 160 }}>{parentProposal?.title || 'Untitled'}</BreadcrumbPageTitle>
      </Link>
    </Box>
  );
}
