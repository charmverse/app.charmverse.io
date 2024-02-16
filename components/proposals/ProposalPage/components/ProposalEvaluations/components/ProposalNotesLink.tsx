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

const StyledIcon = styled(StyledLink)`
  svg {
    font-size: 20px;
  }
`;

export function ProposalNotesLink({ proposalId }: { proposalId?: string }) {
  const { showPage } = usePageDialog();
  const { showError } = useSnackbar();
  const { trigger: getPageId } = useGetOrCreateProposalNotesId({ proposalId });

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
