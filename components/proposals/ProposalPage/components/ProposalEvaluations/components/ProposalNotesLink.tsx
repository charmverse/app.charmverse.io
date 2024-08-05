import styled from '@emotion/styled';
import type { MouseEvent } from 'react';

import { useGetOrCreateProposalNotesId } from 'charmClient/hooks/proposals';
import {
  StyledLink,
  StyledTypography
} from 'components/common/CharmEditor/components/nestedPage/components/NestedPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageIcon } from 'components/common/PageIcon';
import { useSnackbar } from 'hooks/useSnackbar';

const StyledPageLink = styled(StyledLink)`
  svg {
    font-size: 20px;
  }
`;

export function ProposalNotesLink({ proposalId }: { proposalId?: string }) {
  const { showPage } = usePageDialog();
  const { showError } = useSnackbar();

  const { trigger: getNotesPageId } = useGetOrCreateProposalNotesId();

  async function onClickInternalLink(e: MouseEvent<HTMLAnchorElement>) {
    try {
      const result = await getNotesPageId({ proposalId });
      if (result?.pageId) {
        showPage({ pageId: result.pageId });
        e.preventDefault();
      }
    } catch (error) {
      showError(error, 'Failed to load notes');
    }
  }

  return (
    <StyledPageLink onClick={onClickInternalLink}>
      <PageIcon pageType='page' />
      <StyledTypography variant='caption'>Reviewer Notes</StyledTypography>
    </StyledPageLink>
  );
}
