import styled from '@emotion/styled';
import type { MouseEvent } from 'react';

import { useGetOrCreateProposalNotesId } from 'charmClient/hooks/proposals';
import {
  StyledLink,
  StyledTypography
} from 'components/common/CharmEditor/components/nestedPage/components/NestedPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageIcon } from 'components/common/PageIcon';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';

const StyledIcon = styled(StyledLink)`
  svg {
    font-size: 20px;
  }
`;

export function ProposalNotesLink({ pageId, proposalId }: { pageId?: string; proposalId?: string }) {
  const { showPage } = usePageDialog();
  const { showError } = useSnackbar();
  const { pages } = usePages();
  const syncedPageId = pageId ? pages[pageId]?.syncWithPageId : null;
  const _proposalId = proposalId ?? (syncedPageId ? pages[syncedPageId]?.proposalId : null) ?? null;

  const { trigger: getPageId } = useGetOrCreateProposalNotesId({ proposalId: _proposalId });

  async function onClickInternalLink(e: MouseEvent<HTMLAnchorElement>) {
    try {
      const result = await getPageId();
      if (result?.pageId) {
        showPage({ pageId: result.pageId });
        e.preventDefault();
      }
    } catch (error) {
      showError(error, 'Failed to load notes');
    }
  }

  return (
    <StyledIcon onClick={onClickInternalLink}>
      <PageIcon pageType='page' />
      <StyledTypography variant='caption'>Reviewer Notes</StyledTypography>
    </StyledIcon>
  );
}
